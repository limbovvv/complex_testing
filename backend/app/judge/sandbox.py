import os
import tempfile
from typing import Tuple
import docker
from docker.errors import ImageNotFound

IMAGE_MAP = {
    "python": "exam-python:latest",
    "node": "exam-node:latest",
    "cpp": "exam-cpp:latest",
}

MAX_LOG_BYTES = 64 * 1024


def _docker_client():
    return docker.from_env()


def ensure_images():
    client = _docker_client()
    for _, image in IMAGE_MAP.items():
        try:
            client.images.get(image)
        except ImageNotFound as exc:
            raise RuntimeError(f"Judge image not found: {image}") from exc


def normalize_output(text: str) -> str:
    text = text.replace("\r\n", "\n")
    lines = text.split("\n")
    while lines and lines[-1].strip() == "":
        lines.pop()
    return "\n".join(line.rstrip() for line in lines)


def _read_file_limited(path: str) -> str:
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as f:
        data = f.read(MAX_LOG_BYTES)
    return data.decode("utf-8", errors="ignore")


def run_in_sandbox(language: str, code: str, input_data: str) -> Tuple[str, str, str]:
    ensure_images()
    client = _docker_client()
    image = IMAGE_MAP[language]

    with tempfile.TemporaryDirectory() as tmpdir:
        if language == "python":
            filename = "main.py"
            cmd = "python /workspace/main.py < /workspace/input.txt > /workspace/output.txt 2> /workspace/err.txt"
        elif language == "node":
            filename = "main.js"
            cmd = "node /workspace/main.js < /workspace/input.txt > /workspace/output.txt 2> /workspace/err.txt"
        else:
            filename = "main.cpp"
            cmd = (
                "g++ -O2 -std=c++17 /workspace/main.cpp -o /workspace/main 2> /workspace/err.txt && "
                "/workspace/main < /workspace/input.txt > /workspace/output.txt 2>> /workspace/err.txt"
            )

        with open(os.path.join(tmpdir, filename), "w", encoding="utf-8") as f:
            f.write(code)
        with open(os.path.join(tmpdir, "input.txt"), "w", encoding="utf-8") as f:
            f.write(input_data)

        container = client.containers.run(
            image,
            ["/bin/sh", "-lc", cmd],
            detach=True,
            network_mode="none",
            mem_limit="256m",
            pids_limit=64,
            stdout=True,
            stderr=True,
            volumes={tmpdir: {"bind": "/workspace", "mode": "rw"}},
            working_dir="/workspace",
        )

        try:
            result = container.wait(timeout=1.2)
            status_code = result.get("StatusCode", 1)
            stdout_text = _read_file_limited(os.path.join(tmpdir, "output.txt"))
            stderr_text = _read_file_limited(os.path.join(tmpdir, "err.txt"))
            if status_code != 0:
                return "RE", stdout_text, stderr_text
            return "OK", stdout_text, stderr_text
        except Exception:
            container.kill()
            return "TLE", "", ""
        finally:
            container.remove(force=True)


def run_task_in_sandbox(language: str, code: str, testcases: list[tuple[str, str]]) -> Tuple[list[str], bool]:
    ensure_images()
    client = _docker_client()
    image = IMAGE_MAP[language]

    with tempfile.TemporaryDirectory() as tmpdir:
        if language == "python":
            filename = "main.py"
            run_cmd = "python /workspace/main.py < /workspace/input.txt > /workspace/output.txt 2> /workspace/err.txt"
            compile_cmd = None
        elif language == "node":
            filename = "main.js"
            run_cmd = "node /workspace/main.js < /workspace/input.txt > /workspace/output.txt 2> /workspace/err.txt"
            compile_cmd = None
        else:
            filename = "main.cpp"
            compile_cmd = "g++ -O2 -std=c++17 /workspace/main.cpp -o /workspace/main 2> /workspace/err.txt"
            run_cmd = "/workspace/main < /workspace/input.txt > /workspace/output.txt 2>> /workspace/err.txt"

        with open(os.path.join(tmpdir, filename), "w", encoding="utf-8") as f:
            f.write(code)

        container = client.containers.run(
            image,
            ["/bin/sh", "-lc", "tail -f /dev/null"],
            detach=True,
            network_mode="none",
            mem_limit="256m",
            pids_limit=64,
            stdout=True,
            stderr=True,
            volumes={tmpdir: {"bind": "/workspace", "mode": "rw"}},
            working_dir="/workspace",
        )

        verdicts: list[str] = []
        all_ok = True

        try:
            if compile_cmd:
                try:
                    exec_result = container.exec_run(["/bin/sh", "-lc", compile_cmd], timeout=1.2)
                except Exception:
                    verdicts = ["TLE"] * len(testcases)
                    return verdicts, False
                if exec_result.exit_code != 0:
                    verdicts = ["RE"] * len(testcases)
                    return verdicts, False

            for input_data, expected in testcases:
                with open(os.path.join(tmpdir, "input.txt"), "w", encoding="utf-8") as f:
                    f.write(input_data)
                try:
                    exec_result = container.exec_run(["/bin/sh", "-lc", run_cmd], timeout=1.2)
                except Exception:
                    verdicts.append("TLE")
                    all_ok = False
                    verdicts.extend(["TLE"] * (len(testcases) - len(verdicts)))
                    break

                if exec_result.exit_code != 0:
                    verdicts.append("RE")
                    all_ok = False
                    verdicts.extend(["RE"] * (len(testcases) - len(verdicts)))
                    break

                stdout_text = _read_file_limited(os.path.join(tmpdir, "output.txt"))
                out_norm = normalize_output(stdout_text)
                exp_norm = normalize_output(expected)
                if out_norm == exp_norm:
                    verdicts.append("AC")
                else:
                    verdicts.append("WA")
                    all_ok = False
        finally:
            container.remove(force=True)

        return verdicts, all_ok

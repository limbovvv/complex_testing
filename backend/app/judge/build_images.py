import docker
import time

IMAGES = {
    "exam-python:latest": "/app/judge_images/python",
    "exam-node:latest": "/app/judge_images/node",
    "exam-cpp:latest": "/app/judge_images/cpp",
}


def main() -> None:
    client = None
    last_error = None
    for _ in range(10):
        try:
            client = docker.from_env()
            client.ping()
            break
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(2)
    if client is None:
        raise RuntimeError(f"Cannot connect to container runtime API: {last_error}")

    for tag, path in IMAGES.items():
        try:
            client.images.get(tag)
            print(f"Image already exists: {tag}")
        except docker.errors.ImageNotFound:
            print(f"Building image: {tag} from {path}")
            client.images.build(path=path, tag=tag)


if __name__ == "__main__":
    main()

import asyncio
from sqlalchemy import select, delete

from app.db.session import AsyncSessionLocal
from app.models import User, Question, ProgTask, ProgTestcase
from app.core.security import hash_password


async def seed():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == "admin@example.com"))
        admin_user = res.scalar_one_or_none()
        if not admin_user:
            admin = User(
                email="admin@example.com",
                password_hash=hash_password("admin123"),
                last_name="Администратор",
                first_name="Системы",
                middle_name=None,
                phone="+70000000000",
                faculty="Факультет связи и автоматизированное управление войсками",
                is_admin=True,
            )
            session.add(admin)
        else:
            if not admin_user.last_name:
                admin_user.last_name = "Администратор"
            if not admin_user.first_name:
                admin_user.first_name = "Системы"
            if not admin_user.phone:
                admin_user.phone = "+70000000000"
            if not admin_user.faculty:
                admin_user.faculty = "Факультет связи и автоматизированное управление войсками"

        # Questions
        # Replace math/ru questions to keep seed consistent
        await session.execute(delete(Question).where(Question.subject.in_(["math", "ru"])))

        math_questions = [
            Question(
                subject="math",
                question="Решите уравнение: 2x − 5 = 9",
                options=["2", "3", "7", "9"],
                correct_index=2,
                published=True,
            ),
            Question(
                subject="math",
                question="Вычислите: (3^2 − 5) · 2",
                options=["8", "10", "12", "14"],
                correct_index=1,
                published=True,
            ),
            Question(
                subject="math",
                question="Найдите значение выражения (2/3) + (1/6)",
                options=["1/2", "2/3", "5/6", "1"],
                correct_index=2,
                published=True,
            ),
            Question(
                subject="math",
                question="В треугольнике два угла равны 50° и 60°. Найдите третий угол.",
                options=["60°", "70°", "80°", "90°"],
                correct_index=1,
                published=True,
            ),
            Question(
                subject="math",
                question="Скорость 60 км/ч. Сколько километров пройдет автомобиль за 1.5 часа?",
                options=["80", "85", "90", "100"],
                correct_index=2,
                published=True,
            ),
        ]
        ru_questions = [
            Question(
                subject="ru",
                question="Укажите слово с безударной гласной, проверяемой ударением",
                options=["б..рёза", "м..локо", "л..мон", "к..мната"],
                correct_index=0,
                published=True,
            ),
            Question(
                subject="ru",
                question="В каком слове пишется Ь?",
                options=["камыш..", "мяч..", "ночь", "плащ.."],
                correct_index=2,
                published=True,
            ),
            Question(
                subject="ru",
                question="Укажите вариант с правильным ударением",
                options=["кУхонный", "звОнит", "красИвее", "жалюзИ"],
                correct_index=3,
                published=True,
            ),
            Question(
                subject="ru",
                question="Какое слово является прилагательным?",
                options=["смелость", "читать", "смелый", "быстро"],
                correct_index=2,
                published=True,
            ),
            Question(
                subject="ru",
                question="В каком слове есть приставка?",
                options=["вход", "сад", "дом", "окно"],
                correct_index=0,
                published=True,
            ),
        ]
        session.add_all(math_questions + ru_questions)

        res_t = await session.execute(select(ProgTask))
        if not res_t.scalars().first():
            tasks = [
                ProgTask(
                    title="Сумма двух чисел",
                    statement="Даны два целых числа. Выведите их сумму.",
                    published=True,
                ),
                ProgTask(
                    title="Максимум из трех",
                    statement="Даны три целых числа. Выведите наибольшее.",
                    published=True,
                ),
                ProgTask(
                    title="Количество четных",
                    statement="Дано N и затем N чисел. Выведите количество четных.",
                    published=True,
                ),
                ProgTask(
                    title="Палиндром",
                    statement="Дана строка. Выведите YES если это палиндром, иначе NO.",
                    published=True,
                ),
                ProgTask(
                    title="Факториал",
                    statement="Дано число N (0<=N<=12). Выведите N!.",
                    published=True,
                ),
            ]
            session.add_all(tasks)
            await session.flush()

            testcases = [
                # Task 1
                ProgTestcase(task_id=tasks[0].id, input_data="2 3\n", output_data="5\n", is_hidden=False),
                ProgTestcase(task_id=tasks[0].id, input_data="-5 10\n", output_data="5\n", is_hidden=True),
                # Task 2
                ProgTestcase(task_id=tasks[1].id, input_data="1 2 3\n", output_data="3\n", is_hidden=False),
                ProgTestcase(task_id=tasks[1].id, input_data="9 7 8\n", output_data="9\n", is_hidden=True),
                # Task 3
                ProgTestcase(task_id=tasks[2].id, input_data="5\n1 2 3 4 5\n", output_data="2\n", is_hidden=False),
                ProgTestcase(task_id=tasks[2].id, input_data="4\n2 2 2 2\n", output_data="4\n", is_hidden=True),
                # Task 4
                ProgTestcase(task_id=tasks[3].id, input_data="level\n", output_data="YES\n", is_hidden=False),
                ProgTestcase(task_id=tasks[3].id, input_data="hello\n", output_data="NO\n", is_hidden=True),
                # Task 5
                ProgTestcase(task_id=tasks[4].id, input_data="5\n", output_data="120\n", is_hidden=False),
                ProgTestcase(task_id=tasks[4].id, input_data="0\n", output_data="1\n", is_hidden=True),
            ]
            session.add_all(testcases)

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())

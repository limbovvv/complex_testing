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
                password_hash=hash_password("admin"),
                last_name="Администратор",
                first_name="Системы",
                middle_name=None,
                phone="+70000000000",
                faculty="Факультет связи и автоматизированное управление войсками",
                is_admin=True,
            )
            session.add(admin)
        else:
            admin_user.password_hash = hash_password("admin")
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
                question="Решите уравнение: 3x - 8 = 16. В ответе укажите значение x.",
                correct_answer="8",
                options=None,
                correct_index=None,
                published=True,
            ),
            Question(
                subject="math",
                question="Найдите значение выражения: (2^5 * 5^3) / 10^3.",
                correct_answer="4",
                options=None,
                correct_index=None,
                published=True,
            ),
            Question(
                subject="math",
                question="В арифметической прогрессии a1 = 7, d = 3. Найдите a10.",
                correct_answer="34",
                options=None,
                correct_index=None,
                published=True,
            ),
            Question(
                subject="math",
                question="Решите неравенство: 2x - 5 > 9. В ответе укажите наименьшее целое x, подходящее под неравенство.",
                correct_answer="8",
                options=None,
                correct_index=None,
                published=True,
            ),
            Question(
                subject="math",
                question="Найдите корень уравнения: log2(x) = 5.",
                correct_answer="32",
                options=None,
                correct_index=None,
                published=True,
            ),
        ]
        ru_questions = [
            Question(
                subject="ru",
                question="Укажите слово с ударением на второй слог: квартал, каталог, жалюзи, звонит. В ответе напишите это слово строчными буквами.",
                correct_answer="жалюзи",
                options=None,
                correct_index=None,
                published=True,
            ),
            Question(
                subject="ru",
                question="В каком слове пишется НН: ветре..ый день, стари..ый замок, деревя..ый стол, серебря..ый браслет. Напишите слово полностью строчными буквами.",
                correct_answer="старинный",
                options=None,
                correct_index=None,
                published=True,
            ),
            Question(
                subject="ru",
                question="Определите часть речи слова \"вследствие\" в предложении: \"Вследствие дождя матч перенесли\". Ответ: одно слово строчными буквами.",
                correct_answer="предлог",
                options=None,
                correct_index=None,
                published=True,
            ),
            Question(
                subject="ru",
                question="Укажите слово, в котором пропущена буква Е: бл..стящий, зап..рать, ст..реть, выж..гать. Напишите слово полностью строчными буквами.",
                correct_answer="стереть",
                options=None,
                correct_index=None,
                published=True,
            ),
            Question(
                subject="ru",
                question="Какой термин обозначает повторение одинаковых согласных звуков для выразительности речи? Ответ одним словом строчными буквами.",
                correct_answer="аллитерация",
                options=None,
                correct_index=None,
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

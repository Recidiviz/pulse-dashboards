# Generic single-database configuration.

## Usage hints for alembic and sqlmodel

Add a new model:
- Write the SqlModel definiton for the table in /app/models.
- Import it into alembic/env.py.
- Run `uv run alembic revision --autogenerate -m "some message"`
- Check your migration.
- Run `uv run alembic upgrade head`

Cleanly undo your migration if something went wrong and you upgraded:
- Run `uv run alembic downgrade -1`
- remove the migration file

Check your database status:
- `uv run alembic history -i` (the -i shows current flag, if you're not on head)

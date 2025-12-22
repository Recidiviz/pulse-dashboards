import inspect
from functools import partial, wraps

import asyncer
from typer import Typer


# Typer does not support async by default yet
# but it's required for database-related commands
# https://github.com/fastapi/typer/issues/88
class AsyncTyper(Typer):
    @staticmethod
    def maybe_run_async(decorator, f):
        if inspect.iscoroutinefunction(f):

            @wraps(f)
            def runner(*args, **kwargs):
                return asyncer.runnify(f)(*args, **kwargs)

            decorator(runner)
        else:
            decorator(f)
        return f

    def callback(self, *args, **kwargs):
        decorator = super().callback(*args, **kwargs)
        return partial(self.maybe_run_async, decorator)

    def command(self, *args, **kwargs):
        decorator = super().command(*args, **kwargs)
        return partial(self.maybe_run_async, decorator)


cli = AsyncTyper()

# extend commands
import app.manage.import_decision_tree  # noqa
import app.manage.parse_decision_tree  # noqa
import app.manage.seed_db  # noqa
import app.manage.force_reset_db  # noqa

import app.manage.evaluate.evaluate_generation  # noqa
import app.manage.evaluate.evaluate_summary  # noqa
import app.manage.evaluate.headless_conversation_eval  # noqa
import app.manage.extract_intake_conversation  # noqa
import app.manage.api_create_plan  # noqa
import app.manage.create_plan  # noqa
import app.manage.import_assessment_tree  # noqa
import app.manage.create_assessment  # noqa
import app.manage.intake  # noqa
import app.manage.generate_client_data  # noqa
import app.manage.conversation_tester  # noqa
import app.manage.process_recording  # noqa
import app.manage.requeue_pending_executions  # noqa
import app.manage.retry_plan_gens  # noqa
import app.manage.migrate_external_to_pseudonymized  # noqa
import app.manage.update_recording_status  # noqa
import app.manage.generate_assessment_migration  # noqa
import app.manage.generate_output_migration  # noqa

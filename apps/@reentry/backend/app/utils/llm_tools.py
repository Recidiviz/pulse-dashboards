from pathlib import Path

from app.utils.action_plan_types import ActionPlan

JINJA_TEMPLATE = (Path(__file__).parent / "action_plan_markdown.md.j2").read_text()


def strip_markdown(markdown: str):
    no_md_tag = markdown.replace("markdown```", "")
    no_md_tag = no_md_tag.replace("```markdown", "")
    return no_md_tag.replace("```", "")


### Rendering template
def convert_to_markdown(plan: ActionPlan):
    # plan = ActionPlan as dict
    from jinja2 import Template

    template = Template(JINJA_TEMPLATE)

    # clean up, no code blocks allowed
    for p in plan.sections:
        p.markdown_content = strip_markdown(p.markdown_content)
    plan.immediate_needs.markdown_content = strip_markdown(
        plan.immediate_needs.markdown_content
    )
    plan.quick_summary_circumstances = strip_markdown(plan.quick_summary_circumstances)
    plan.overview = strip_markdown(plan.overview)
    for m in plan.milestones:
        m.markdown_content = strip_markdown(m.markdown_content)
    for t in plan.timeline:
        t.markdown_content = strip_markdown(t.markdown_content)
    markdown_output = template.render(plan=plan)
    return markdown_output.strip()

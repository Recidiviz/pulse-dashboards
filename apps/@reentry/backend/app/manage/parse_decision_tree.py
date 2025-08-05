from pathlib import Path

from app.utils.mermaid import MermaidParser

from .base import cli


@cli.command()
def parse_decision_tree(filepaths: list[Path]):
    """
    Parses decision trees from a list of Mermaid files.
    """
    for filepath in filepaths:
        print(f"Mermaid file: {filepath}")
        try:
            with open(filepath, "r", encoding="utf8") as f:
                mermaid_content = f.read()
            graph = MermaidParser.parse(mermaid_content)
            start_node_key = graph.get_start_node_key()
            end_node_keys = graph.get_end_node_keys()
            print(f"- Start node: {start_node_key}")
            print(f"- End nodes: {end_node_keys}")
        except Exception as e:
            print(f"Error: {e}")

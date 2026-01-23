from langsmith import Client
from datetime import datetime
from collections import defaultdict
from dotenv import load_dotenv
import os

def build_run_tree(runs):
    runs_by_id = {run.id: run for run in runs}
    children_map = defaultdict(list)
    
    root = None
    for run in runs:
        if hasattr(run, 'parent_run_id') and run.parent_run_id:
            children_map[run.parent_run_id].append(run)
        else:
            root = run
    
    return root, runs_by_id, children_map


def format_duration(td):
    if td is None:
        return "N/A"
    total_seconds = td.total_seconds()
    return f"{total_seconds:.2f}s"


def print_tree(run, children_map, runs_by_id, indent=0, is_last=True, prefix=""):
    duration = None
    if hasattr(run, 'end_time') and hasattr(run, 'start_time'):
        if run.end_time and run.start_time:
            duration = run.end_time - run.start_time
    
    if indent == 0:
        connector = ""
        new_prefix = ""
    else:
        connector = "└── " if is_last else "├── "
        new_prefix = prefix + ("    " if is_last else "│   ")
    
    duration_str = format_duration(duration)
    print(f"{prefix}{connector}{run.name} - {duration_str}")
    
    # Print children by start time
    children = children_map.get(run.id, [])
    children_sorted = sorted(children, key=lambda r: r.start_time if hasattr(r, 'start_time') else datetime.min)
    
    for i, child in enumerate(children_sorted):
        print_tree(child, children_map, runs_by_id, indent + 1, 
                  i == len(children_sorted) - 1, new_prefix)

def load_langsmith_client():
    load_dotenv()

    api_key = os.getenv("LANGSMITH_API_KEY") or os.getenv("LANGCHAIN_API_KEY")
    if not api_key:
        raise ValueError("LANGSMITH_API_KEY not found in .env file")
    
    return Client(api_key=api_key)

def main():
    client = load_langsmith_client()

    # Often trace id and run id are the same on LangChain's Smith dashboard. 
    # all projects (dev, staging, demo) set to the same API key are supported.
    trace_id = "019bd7da-e96c-7883-bf03-ad2548d427d6"
    
    runs = list(client.list_runs(
        trace_id=trace_id,
    ))

    root, runs_by_id, children_map = build_run_tree(runs)
    
    if root:
        print_tree(root, children_map, runs_by_id)
    else:
        print("No roots found!")


if __name__ == "__main__":
    main()

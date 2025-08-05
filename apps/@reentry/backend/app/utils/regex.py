import re


def extract_uuids_from_links(text: str, deduplicate=True) -> list[str]:
    r = re.compile(
        r"\]\(#([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)"
    )
    results = r.findall(text)

    # deduplicate but retain the order
    if deduplicate:
        seen = set()
        results = [x for x in results if not (x in seen or seen.add(x))]

    return results

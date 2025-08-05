def statement_or_result(result_type=None, first_only=False):
    """
    Decorator to allow function to be used as statement or result.

    This decorator can be applied to functions that interact with a database
    session. It allows the function to be used in two different modes:

    1. Query Only Mode:
       - If the keyword argument `query_only` is set to True, the function
         will return the statement or query without executing it.
       - This can be useful for constructing queries that you want to
         inspect or modify before execution.

    2. Execution Mode:
       - If `query_only` is False (the default behavior), the function will
         execute the query within an async session context.
       - The result of the execution can be configured in the following ways:
         - `result_type`: If specified, the result will be cast to this type
           (e.g., list, set).
         - `first_only`: If True, only the first result of the query will be
           returned; otherwise, all results will be returned.

    Args:
        result_type (optional): Type to cast the result of executed query.
        first_only (bool): Whether to return only the first result of query.

    Returns:
        function: A decorated asynchronous function which supports both
        query building and execution capabilities.
    """

    def decorator(func):
        async def wrapper(*args, **kwargs):
            query_only = kwargs.pop("query_only", False)
            session = args[0]
            if query_only:
                return await func(*args, **kwargs)
            else:
                query = await func(*args, **kwargs)
                result = await session.exec(query)
                if first_only:
                    return result.first()
                else:
                    if result_type:
                        return result_type(result.all())
                    return result.all()

        return wrapper

    return decorator


def paginate(items: list, page: int, size: int) -> list:
    total = len(items)
    pages = (total + size - 1) // size if total else 0
    page = min(max(1, page), pages) if pages else 1
    offset = (page - 1) * size
    return items[offset : offset + size]


def apply_search_filter(clients, search):
    query = search.lower().strip()
    return [
        c
        for c in clients
        if c.full_name
        and query in f"{c.full_name.given_names} {c.full_name.surname}".lower()
    ]


def sort_clients_by_name(clients, order):
    return [
        c.external_client_id
        for c in sorted(
            clients,
            key=lambda c: f"{c.full_name.given_names} {c.full_name.surname}".lower()
            if c.full_name
            else "",
            reverse=(order == "desc"),
        )
    ]

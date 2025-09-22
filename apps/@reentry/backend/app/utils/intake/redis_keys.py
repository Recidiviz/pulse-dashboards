class RedisKeys:
    """
    Unified Redis key manager for consistent key naming across the application.
    """

    @staticmethod
    def client_connection(client_pseudo_id: str) -> str:
        """Key for client connection tracking."""
        return f"connections:{client_pseudo_id}"

    @staticmethod
    def sid_to_client(sid: str) -> str:
        """Key for mapping socket IDs to client IDs."""
        return f"sid_to_client:{sid}"

    @staticmethod
    def client_session(client_pseudo_id: str) -> str:
        """Key for client session data."""
        return f"client_session:{client_pseudo_id}"

    @staticmethod
    def waiting_for_response(client_pseudo_id: str) -> str:
        """Key for tracking if waiting for user response."""
        return f"waiting_for_response:{client_pseudo_id}"

    @staticmethod
    def waiting_response_data(client_pseudo_id: str) -> str:
        """Key for storing waiting response data."""
        return f"waiting_response:{client_pseudo_id}"

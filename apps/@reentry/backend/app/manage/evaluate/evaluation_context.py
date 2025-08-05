# from langgraph.utils.pydantic import BaseModel

# from app.services.clientdata_record import ClientDataRecord


# class EvaluationExampleFile(BaseModel):
#     summary: str
#     messages: list[dict]
#     oms_data: dict


# class EvaluationExample(EvaluationExampleFile):
#     oms_data: ClientDataRecord | None
#     client_id: str


# type EvaluationExamples = dict[str, EvaluationExample]


# class EvaluationContext:
#     _instance = None

#     @staticmethod
#     def getInstance():
#         return EvaluationContext._instance

#     def __init__(self, examples: EvaluationExamples):
#         if EvaluationContext._instance is not None:
#             raise Exception("This class is a singleton!")
#         else:
#             EvaluationContext._instance = self
#             self.examples = examples  # Dictionary to hold state


# def get_experiment_messages(client_id: str):
#     try:
#         evaluation = EvaluationContext.getInstance()
#         return evaluation.examples[client_id].messages if evaluation else None
#     except Exception:
#         return None


# def get_experiment_summary(client_id: str):
#     try:
#         evaluation = EvaluationContext.getInstance()
#         return evaluation.examples[client_id].summary if evaluation else None
#     except Exception:
#         return None


# def get_experiment_oms_data(client_id: str):
#     try:
#         evaluation = EvaluationContext.getInstance()
#         return evaluation.examples[client_id].oms_data if evaluation else None
#     except Exception:
#         return None

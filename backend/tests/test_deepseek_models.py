import importlib
import os
import sys
import unittest


class DeepSeekModelConfigTest(unittest.TestCase):
    def setUp(self):
        self._old_env = dict(os.environ)
        os.environ.update(
            {
                "LLM_TYPE": "DEEPSEEK",
                "DEEPSEEK_API_KEY": "test-key",
                "DEEPSEEK_BASE_URL": "https://api.deepseek.com",
                "DEEPSEEK_MODEL_NAME": "deepseek-v4-flash",
                "VISION_MODEL_TYPE": "OLLAMA",
            }
        )
        for module_name in ("app.utils.factory", "app.agent.agent"):
            sys.modules.pop(module_name, None)

    def tearDown(self):
        os.environ.clear()
        os.environ.update(self._old_env)
        for module_name in ("app.utils.factory", "app.agent.agent"):
            sys.modules.pop(module_name, None)

    def test_chat_model_factory_supports_deepseek(self):
        factory = importlib.import_module("app.utils.factory")

        model = factory.ChatModelFactory().generator()

        self.assertEqual(type(model).__name__, "ChatOpenAI")

    def test_vision_model_factory_uses_independent_backend(self):
        factory = importlib.import_module("app.utils.factory")

        model = factory.VisionModelFactory().generator()

        self.assertEqual(type(model).__name__, "ChatOllama")

    def test_agent_factory_supports_deepseek(self):
        agent = importlib.import_module("app.agent.agent")

        model = agent.AgentFactory()._create_chat_model()

        self.assertEqual(type(model).__name__, "ChatOpenAI")


if __name__ == "__main__":
    unittest.main()

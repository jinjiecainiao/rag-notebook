import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from langchain_core.documents import Document

from app.services.note_service import NoteService


class _RecordingStore:
    def __init__(self, results):
        self.results = results
        self.filters = []

    def similarity_search_with_score(self, _query, **kwargs):
        self.filters.append(kwargs.get("filter"))
        return self.results


class RelatedNotesIsolationTest(unittest.TestCase):
    def test_both_vector_collections_are_scoped_to_current_user(self):
        note_store = _RecordingStore([
            (
                Document(
                    page_content="related content",
                    metadata={"note_id": "note-2", "title": "Related note"},
                ),
                0.1,
            )
        ])
        knowledge_store = _RecordingStore([])

        class _VectorStoreService:
            def __init__(self):
                self.vectors_store = knowledge_store

        service = object.__new__(NoteService)
        service._notes_store = note_store
        service.get_note = AsyncMock(return_value=SimpleNamespace(content="query note"))

        with patch("app.rag.vector_store.VectorStoreService", _VectorStoreService):
            result = asyncio.run(
                service.get_related_notes(None, "note-1", "user-1", top_k=3)
            )

        self.assertEqual(
            note_store.filters,
            [{"user_id": "user-1", "doc_type": "note"}],
        )
        self.assertEqual(knowledge_store.filters, [{"user_id": "user-1"}])
        self.assertEqual([item["id"] for item in result], ["note-2"])


if __name__ == "__main__":
    unittest.main()

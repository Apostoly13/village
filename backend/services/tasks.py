"""
Background task utilities — fire-and-forget with error logging.
"""
import asyncio
import logging


def _log_task_error(task: asyncio.Task) -> None:
    """Callback: log exceptions from background tasks so they're never silently swallowed."""
    if task.cancelled():
        return
    exc = task.exception()
    if exc:
        logging.error("Background task %s failed: %s", task.get_name(), exc, exc_info=exc)


def fire_and_forget(coro) -> asyncio.Task:
    """Schedule a coroutine as a background task with automatic error logging."""
    task = asyncio.create_task(coro)
    task.add_done_callback(_log_task_error)
    return task

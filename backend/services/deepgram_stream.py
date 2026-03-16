"""
Async Deepgram live transcription wrapper.

Creates a streaming STT connection that fires on_transcript() when a
speech_final result arrives (utterance complete, VAD silence detected).
"""
import os
from typing import Callable, Coroutine, Any

from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions


async def create_deepgram_stream(
    on_transcript: Callable[[str], Coroutine[Any, Any, None]],
    on_error: Callable[[Exception], Coroutine[Any, Any, None]],
):
    """
    Initialise and start a Deepgram async live connection.

    Args:
        on_transcript: async callback(transcript_str) called on every
                       is_final result that contains non-empty text.
        on_error:      async callback(exception) on connection errors.

    Returns:
        An active AsyncLiveClient ready to receive audio via .send().
        Caller is responsible for calling .finish() on disconnect.
    """
    dg = DeepgramClient(os.environ["DEEPGRAM_API_KEY"])
    dg_connection = dg.listen.asynclive.v("1")

    async def _on_message(self, result, **kwargs):
        try:
            transcript = result.channel.alternatives[0].transcript
            if result.is_final and transcript.strip():
                await on_transcript(transcript)
        except Exception as exc:
            await on_error(exc)

    async def _on_error(self, error, **kwargs):
        await on_error(Exception(str(error)))

    dg_connection.on(LiveTranscriptionEvents.Transcript, _on_message)
    dg_connection.on(LiveTranscriptionEvents.Error, _on_error)

    options = LiveOptions(
        model="nova-2",
        encoding="linear16",
        sample_rate=8000,
        channels=1,
        language="en-IN",
        punctuate=True,
        interim_results=False,
        utterance_end_ms="1000",
        vad_events=True,
    )

    started = await dg_connection.start(options)
    if not started:
        raise RuntimeError("Deepgram live connection failed to start")

    return dg_connection

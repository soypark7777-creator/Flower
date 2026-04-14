"""
Local shim to satisfy tensorflowjs converter imports when JAX is not installed.
"""

from types import SimpleNamespace

experimental = SimpleNamespace()

class _Monitoring:
    @staticmethod
    def record_scalar(*_args, **_kwargs):
        return None

monitoring = _Monitoring()

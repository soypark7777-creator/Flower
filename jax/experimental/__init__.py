"""
Local shim to satisfy tensorflowjs converter imports when JAX is not installed.
"""

from . import jax2tf  # noqa: F401

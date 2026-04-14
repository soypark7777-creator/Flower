"""
Local shim to satisfy tensorflowjs import on environments without
tensorflow-decision-forests wheels (e.g., Windows + Python 3.12).
The TFJS Keras converter does not require TF-DF, but the module import
is unconditional. This stub lets the converter proceed.
"""

__all__ = []

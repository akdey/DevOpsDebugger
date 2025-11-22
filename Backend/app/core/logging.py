import logging
import os
from datetime import datetime


def get_logger(name: str = __name__):
    logger = logging.getLogger(name)
    if not logger.handlers:
        # Create logs directory if it doesn't exist
        logs_dir = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
        os.makedirs(logs_dir, exist_ok=True)
        
        # Create file handler
        log_file = os.path.join(logs_dir, f"app_{datetime.now().strftime('%Y%m%d')}.log")
        file_handler = logging.FileHandler(log_file)
        
        # Create console handler
        console_handler = logging.StreamHandler()
        
        fmt = "%(asctime)s %(levelname)s %(name)s: %(message)s"
        formatter = logging.Formatter(fmt)
        
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        logger.setLevel(logging.INFO)
    return logger

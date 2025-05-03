import logging

# Logger'ı yapılandır
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Konsola loglama için bir handler ekle
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Log formatını ayarla
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)

# Logger'a handler ekle
logger.addHandler(console_handler)
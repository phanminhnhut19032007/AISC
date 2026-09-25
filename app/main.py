import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), "smartrent-backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import importlib.util
backend_main_path = os.path.join(backend_dir, "app", "main.py")
spec = importlib.util.spec_from_file_location("smartrent_backend_main", backend_main_path)
module = importlib.util.module_from_spec(spec)
sys.modules["smartrent_backend_main"] = module
spec.loader.exec_module(module)

app = module.app
lifespan = module.lifespan

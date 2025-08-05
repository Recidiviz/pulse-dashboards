# Notebooks

## Setup
To run the notebooks, here are the recommended steps (there are many other ways, feel free to ignore)


From the backend folder, start jupyter with the uv env.
```bash
uv run --with jupyter jupyter lab
```

This will give you the url and token of your jupyter server with the full uv environment.
If you use vs code, open the notebook, open the kernel selector, and point it to the server.

In this setup, you cannot install libraries from your notebooks, but you have access to all the libraries installed in the uv project.
Each time you reset the server it changes the token. TODO fix this.
FROM condaforge/mambaforge

# Set environment variables
ENV PATH=/opt/conda/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    CONDA_DIR=/opt/conda \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# Set working directory
WORKDIR /workspace

# Expose port
EXPOSE 8000

# Install Mamba (if not already installed in the base image)
RUN conda install -n base -c conda-forge mamba

# Set default command to start a shell
CMD ["/bin/bash"]

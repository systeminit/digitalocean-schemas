function main() {
    // DigitalOcean API Token secret
    const DOCredentialSecretProp = new SecretPropBuilder()
        .setName("DigitalOcean Credential")
        .setSecretKind("DigitalOcean Credential")
        .build();

    // Name property (required for single droplet)
    const nameProp = new PropBuilder()
        .setName("name")
        .setKind("string")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("text")
            .build())
        .setValidationFormat(Joi.string().required().max(255).pattern(/^[a-zA-Z0-9]?[a-z0-9A-Z.\-]*[a-z0-9A-Z]$/))
        .setDocumentation("The human-readable string you wish to use when displaying the Droplet name. The name, if set to a domain name managed in the DigitalOcean DNS management system, will configure a PTR record for the Droplet. The name set during creation will also determine the hostname for the Droplet in its internal configuration. Only one of Name, Size or Image can be updated at a time.")
        .build();

    // Region property
    const regionProp = new PropBuilder()
        .setName("region")
        .setKind("string")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("comboBox")
            .addOption("New York 1", "nyc1")
            .addOption("New York 3", "nyc3")
            .addOption("Amsterdam 3", "ams3")
            .addOption("San Francisco 3", "sfo3")
            .addOption("Singapore 1", "sgp1")
            .addOption("London 1", "lon1")
            .addOption("Frankfurt 1", "fra1")
            .addOption("Toronto 1", "tor1")
            .addOption("Bangalore 1", "blr1")
            .setCreateOnly()
            .build())
        .setValidationFormat(Joi.string().required())
        .setDocumentation("The slug identifier for the region that you wish to deploy the Droplet in. If the specific datacenter is not not important, a slug prefix (e.g. `nyc`) can be used to deploy the Droplet in any of the that region's locations (`nyc1`, `nyc2`, or `nyc3`). If the region is omitted from the create request completely, the Droplet may deploy in any region.")
        .build();

    // Size property
    const sizeProp = new PropBuilder()
        .setName("size")
        .setKind("string")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("comboBox")
            // Basic
            .addOption("Basic (1 vCPU, 512MB RAM)", "s-1vcpu-512mb-10gb")
            .addOption("Basic (1 vCPU, 1GB RAM)", "s-1vcpu-1gb")
            .addOption("Basic (1 vCPU, 2GB RAM)", "s-1vcpu-2gb")
            .addOption("Basic (2 vCPU, 2GB RAM)", "s-2vcpu-2gb")
            .addOption("Basic (2 vCPU, 4GB RAM)", "s-2vcpu-4gb")
            .addOption("Basic (4 vCPU, 8GB RAM)", "s-4vcpu-8gb")
            .addOption("Basic (8 vCPU, 16GB RAM)", "s-8vcpu-16gb")

            // Basic AMD
            .addOption("Basic AMD (1 vCPU, 1GB RAM)", "s-1vcpu-1gb-amd")
            .addOption("Basic AMD (1 vCPU, 2GB RAM)", "s-1vcpu-2gb-amd")
            .addOption("Basic AMD (2 vCPU, 2GB RAM)", "s-2vcpu-2gb-amd")
            .addOption("Basic AMD (2 vCPU, 4GB RAM)", "s-2vcpu-4gb-amd")
            .addOption("Basic AMD (2 vCPU, 8GB RAM)", "s-2vcpu-8gb-amd")
            .addOption("Basic AMD (4 vCPU, 8GB RAM)", "s-4vcpu-8gb-amd")
            .addOption("Basic AMD (4 vCPU, 16GB RAM)", "s-4vcpu-16gb-amd")
            .addOption("Basic AMD (8 vCPU, 16GB RAM)", "s-8vcpu-16gb-amd")
            .addOption("Basic AMD (8 vCPU, 32GB RAM)", "s-8vcpu-32gb-amd")

            // Basic Intel
            .addOption("Basic Intel (1 vCPU, 1GB RAM)", "s-1vcpu-1gb-intel")
            .addOption("Basic Intel (1 vCPU, 1GB RAM, 35GB disk)", "s-1vcpu-1gb-35gb-intel")
            .addOption("Basic Intel (1 vCPU, 2GB RAM)", "s-1vcpu-2gb-intel")
            .addOption("Basic Intel (1 vCPU, 2GB RAM, 70GB disk)", "s-1vcpu-2gb-70gb-intel")
            .addOption("Basic Intel (2 vCPU, 2GB RAM)", "s-2vcpu-2gb-intel")
            .addOption("Basic Intel (2 vCPU, 2GB RAM, 90GB disk)", "s-2vcpu-2gb-90gb-intel")
            .addOption("Basic Intel (2 vCPU, 4GB RAM)", "s-2vcpu-4gb-intel")
            .addOption("Basic Intel (2 vCPU, 4GB RAM, 120GB disk)", "s-2vcpu-4gb-120gb-intel")
            .addOption("Basic Intel (2 vCPU, 8GB RAM, 160GB disk)", "s-2vcpu-8gb-160gb-intel")
            .addOption("Basic Intel (4 vCPU, 8GB RAM)", "s-4vcpu-8gb-intel")
            .addOption("Basic Intel (4 vCPU, 8GB RAM, 240GB disk)", "s-4vcpu-8gb-240gb-intel")
            .addOption("Basic Intel (4 vCPU, 16GB RAM, 320GB disk)", "s-4vcpu-16gb-320gb-intel")
            .addOption("Basic Intel (8 vCPU, 16GB RAM)", "s-8vcpu-16gb-intel")
            .addOption("Basic Intel (8 vCPU, 16GB RAM, 480GB disk)", "s-8vcpu-16gb-480gb-intel")
            .addOption("Basic Intel (8 vCPU, 32GB RAM, 640GB disk)", "s-8vcpu-32gb-640gb-intel")

            // CPU-Optimized
            .addOption("CPU-Optimized (2 vCPU, 4GB RAM)", "c-2")
            .addOption("CPU-Optimized (4 vCPU, 8GB RAM)", "c-4")
            .addOption("CPU-Optimized (8 vCPU, 16GB RAM)", "c-8")
            .addOption("CPU-Optimized (16 vCPU, 32GB RAM)", "c-16")
            .addOption("CPU-Optimized (32 vCPU, 64GB RAM)", "c-32")
            .addOption("CPU-Optimized (48 vCPU, 96GB RAM)", "c-48")

            // CPU-Optimized Premium Intel
            .addOption("CPU-Optimized Intel (4 vCPU, 8GB RAM)", "c-4-intel")
            .addOption("CPU-Optimized Intel (8 vCPU, 16GB RAM)", "c-8-intel")
            .addOption("CPU-Optimized Intel (16 vCPU, 32GB RAM)", "c-16-intel")
            .addOption("CPU-Optimized Intel (32 vCPU, 64GB RAM)", "c-32-intel")
            .addOption("CPU-Optimized Intel (48 vCPU, 96GB RAM)", "c-48-intel")
            .addOption("CPU-Optimized Intel (60 vCPU, 120GB RAM)", "c-60-intel")

            // CPU-Optimized 2x SSD
            .addOption("CPU-Optimized 2x SSD (2 vCPU, 4GB RAM)", "c2-2vcpu-4gb")
            .addOption("CPU-Optimized 2x SSD (4 vCPU, 8GB RAM)", "c2-4vcpu-8gb")
            .addOption("CPU-Optimized 2x SSD (8 vCPU, 16GB RAM)", "c2-8vcpu-16gb")
            .addOption("CPU-Optimized 2x SSD (16 vCPU, 32GB RAM)", "c2-16vcpu-32gb")
            .addOption("CPU-Optimized 2x SSD (32 vCPU, 64GB RAM)", "c2-32vcpu-64gb")
            .addOption("CPU-Optimized 2x SSD (48 vCPU, 96GB RAM)", "c2-48vcpu-96gb")

            // CPU-Optimized 2x SSD Premium Intel
            .addOption("CPU-Optimized 2x SSD Intel (4 vCPU, 8GB RAM)", "c2-4vcpu-8gb-intel")
            .addOption("CPU-Optimized 2x SSD Intel (8 vCPU, 16GB RAM)", "c2-8vcpu-16gb-intel")
            .addOption("CPU-Optimized 2x SSD Intel (16 vCPU, 32GB RAM)", "c2-16vcpu-32gb-intel")
            .addOption("CPU-Optimized 2x SSD Intel (32 vCPU, 64GB RAM)", "c2-32vcpu-64gb-intel")
            .addOption("CPU-Optimized 2x SSD Intel (48 vCPU, 96GB RAM)", "c2-48vcpu-96gb-intel")
            .addOption("CPU-Optimized 2x SSD Intel (60 vCPU, 120GB RAM)", "c2-60vcpu-120gb-intel")

            // CPU Intensive 5x SSD
            .addOption("CPU Intensive 5x SSD (2 vCPU, 4GB RAM)", "c5-2vcpu-4gb")
            .addOption("CPU Intensive 5x SSD (4 vCPU, 8GB RAM)", "c5-4vcpu-8gb")
            .addOption("CPU Intensive 5x SSD (8 vCPU, 16GB RAM)", "c5-8vcpu-16gb")
            .addOption("CPU Intensive 5x SSD (16 vCPU, 32GB RAM)", "c5-16vcpu-32gb")
            .addOption("CPU Intensive 5x SSD (32 vCPU, 64GB RAM)", "c5-32vcpu-64gb")
            .addOption("CPU Intensive 5x SSD (48 vCPU, 96GB RAM)", "c5-48vcpu-96gb")

            // CPU Intensive 5x SSD Premium Intel
            .addOption("CPU Intensive 5x SSD Intel (4 vCPU, 8GB RAM)", "c5-4vcpu-8gb-intel")
            .addOption("CPU Intensive 5x SSD Intel (8 vCPU, 16GB RAM)", "c5-8vcpu-16gb-intel")
            .addOption("CPU Intensive 5x SSD Intel (16 vCPU, 32GB RAM)", "c5-16vcpu-32gb-intel")
            .addOption("CPU Intensive 5x SSD Intel (32 vCPU, 64GB RAM)", "c5-32vcpu-64gb-intel")
            .addOption("CPU Intensive 5x SSD Intel (48 vCPU, 96GB RAM)", "c5-48vcpu-96gb-intel")
            .addOption("CPU Intensive 5x SSD Intel (60 vCPU, 120GB RAM)", "c5-60vcpu-120gb-intel")

            // General Purpose
            .addOption("General Purpose (2 vCPU, 8GB RAM)", "g-2vcpu-8gb")
            .addOption("General Purpose (4 vCPU, 16GB RAM)", "g-4vcpu-16gb")
            .addOption("General Purpose (8 vCPU, 32GB RAM)", "g-8vcpu-32gb")
            .addOption("General Purpose (16 vCPU, 64GB RAM)", "g-16vcpu-64gb")
            .addOption("General Purpose (32 vCPU, 128GB RAM)", "g-32vcpu-128gb")
            .addOption("General Purpose (40 vCPU, 160GB RAM)", "g-40vcpu-160gb")

            // General Purpose Premium Intel
            .addOption("General Purpose Intel (2 vCPU, 8GB RAM)", "g-2vcpu-8gb-intel")
            .addOption("General Purpose Intel (4 vCPU, 16GB RAM)", "g-4vcpu-16gb-intel")
            .addOption("General Purpose Intel (8 vCPU, 32GB RAM)", "g-8vcpu-32gb-intel")
            .addOption("General Purpose Intel (16 vCPU, 64GB RAM)", "g-16vcpu-64gb-intel")
            .addOption("General Purpose Intel (32 vCPU, 128GB RAM)", "g-32vcpu-128gb-intel")
            .addOption("General Purpose Intel (48 vCPU, 192GB RAM)", "g-48vcpu-192gb-intel")
            .addOption("General Purpose Intel (60 vCPU, 240GB RAM)", "g-60vcpu-240gb-intel")

            // General Purpose 2x SSD
            .addOption("General Purpose 2x SSD (2 vCPU, 8GB RAM)", "gd-2vcpu-8gb")
            .addOption("General Purpose 2x SSD (4 vCPU, 16GB RAM)", "gd-4vcpu-16gb")
            .addOption("General Purpose 2x SSD (8 vCPU, 32GB RAM)", "gd-8vcpu-32gb")
            .addOption("General Purpose 2x SSD (16 vCPU, 64GB RAM)", "gd-16vcpu-64gb")
            .addOption("General Purpose 2x SSD (32 vCPU, 128GB RAM)", "gd-32vcpu-128gb")
            .addOption("General Purpose 2x SSD (40 vCPU, 160GB RAM)", "gd-40vcpu-160gb")

            // General Purpose 2x SSD Premium Intel
            .addOption("General Purpose 2x SSD Intel (2 vCPU, 8GB RAM)", "gd-2vcpu-8gb-intel")
            .addOption("General Purpose 2x SSD Intel (4 vCPU, 16GB RAM)", "gd-4vcpu-16gb-intel")
            .addOption("General Purpose 2x SSD Intel (8 vCPU, 32GB RAM)", "gd-8vcpu-32gb-intel")
            .addOption("General Purpose 2x SSD Intel (16 vCPU, 64GB RAM)", "gd-16vcpu-64gb-intel")
            .addOption("General Purpose 2x SSD Intel (32 vCPU, 128GB RAM)", "gd-32vcpu-128gb-intel")
            .addOption("General Purpose 2x SSD Intel (48 vCPU, 192GB RAM)", "gd-48vcpu-192gb-intel")
            .addOption("General Purpose 2x SSD Intel (60 vCPU, 240GB RAM)", "gd-60vcpu-240gb-intel")

            // General Purpose 5.5x SSD Premium Intel
            .addOption("General Purpose 5.5x SSD Intel (2 vCPU, 8GB RAM)", "g5_5-2vcpu-8gb-intel")
            .addOption("General Purpose 5.5x SSD Intel (4 vCPU, 16GB RAM)", "g5_5-4vcpu-16gb-intel")
            .addOption("General Purpose 5.5x SSD Intel (8 vCPU, 32GB RAM)", "g5_5-8vcpu-32gb-intel")
            .addOption("General Purpose 5.5x SSD Intel (16 vCPU, 64GB RAM)", "g5_5-16vcpu-64gb-intel")
            .addOption("General Purpose 5.5x SSD Intel (32 vCPU, 128GB RAM)", "g5_5-32vcpu-128gb-intel")
            .addOption("General Purpose 5.5x SSD Intel (48 vCPU, 192GB RAM)", "g5_5-48vcpu-192gb-intel")
            .addOption("General Purpose 5.5x SSD Intel (60 vCPU, 240GB RAM)", "g5_5-60vcpu-240gb-intel")

            // General Purpose 6.5x SSD
            .addOption("General Purpose 6.5x SSD (2 vCPU, 8GB RAM)", "g6_5-2vcpu-8gb")
            .addOption("General Purpose 6.5x SSD (4 vCPU, 16GB RAM)", "g6_5-4vcpu-16gb")
            .addOption("General Purpose 6.5x SSD (8 vCPU, 32GB RAM)", "g6_5-8vcpu-32gb")
            .addOption("General Purpose 6.5x SSD (16 vCPU, 64GB RAM)", "g6_5-16vcpu-64gb")
            .addOption("General Purpose 6.5x SSD (32 vCPU, 128GB RAM)", "g6_5-32vcpu-128gb")
            .addOption("General Purpose 6.5x SSD (40 vCPU, 160GB RAM)", "g6_5-40vcpu-160gb")

            // Memory-Optimized
            .addOption("Memory-Optimized (2 vCPU, 16GB RAM)", "m-2vcpu-16gb")
            .addOption("Memory-Optimized (4 vCPU, 32GB RAM)", "m-4vcpu-32gb")
            .addOption("Memory-Optimized (8 vCPU, 64GB RAM)", "m-8vcpu-64gb")
            .addOption("Memory-Optimized (16 vCPU, 128GB RAM)", "m-16vcpu-128gb")
            .addOption("Memory-Optimized (24 vCPU, 192GB RAM)", "m-24vcpu-192gb")
            .addOption("Memory-Optimized (32 vCPU, 256GB RAM)", "m-32vcpu-256gb")

            // Memory-Optimized Premium Intel
            .addOption("Memory-Optimized Intel (2 vCPU, 16GB RAM)", "m-2vcpu-16gb-intel")
            .addOption("Memory-Optimized Intel (4 vCPU, 32GB RAM)", "m-4vcpu-32gb-intel")
            .addOption("Memory-Optimized Intel (8 vCPU, 64GB RAM)", "m-8vcpu-64gb-intel")
            .addOption("Memory-Optimized Intel (16 vCPU, 128GB RAM)", "m-16vcpu-128gb-intel")
            .addOption("Memory-Optimized Intel (24 vCPU, 192GB RAM)", "m-24vcpu-192gb-intel")
            .addOption("Memory-Optimized Intel (32 vCPU, 256GB RAM)", "m-32vcpu-256gb-intel")
            .addOption("Memory-Optimized Intel (48 vCPU, 384GB RAM)", "m-48vcpu-384gb-intel")

            // Memory-Optimized 3x SSD
            .addOption("Memory-Optimized 3x SSD (2 vCPU, 16GB RAM)", "m3-2vcpu-16gb")
            .addOption("Memory-Optimized 3x SSD (4 vCPU, 32GB RAM)", "m3-4vcpu-32gb")
            .addOption("Memory-Optimized 3x SSD (8 vCPU, 64GB RAM)", "m3-8vcpu-64gb")
            .addOption("Memory-Optimized 3x SSD (16 vCPU, 128GB RAM)", "m3-16vcpu-128gb")
            .addOption("Memory-Optimized 3x SSD (24 vCPU, 192GB RAM)", "m3-24vcpu-192gb")
            .addOption("Memory-Optimized 3x SSD (32 vCPU, 256GB RAM)", "m3-32vcpu-256gb")

            // Memory-Optimized 3x SSD Premium Intel
            .addOption("Memory-Optimized 3x SSD Intel (2 vCPU, 16GB RAM)", "m3-2vcpu-16gb-intel")
            .addOption("Memory-Optimized 3x SSD Intel (4 vCPU, 32GB RAM)", "m3-4vcpu-32gb-intel")
            .addOption("Memory-Optimized 3x SSD Intel (8 vCPU, 64GB RAM)", "m3-8vcpu-64gb-intel")
            .addOption("Memory-Optimized 3x SSD Intel (16 vCPU, 128GB RAM)", "m3-16vcpu-128gb-intel")
            .addOption("Memory-Optimized 3x SSD Intel (24 vCPU, 192GB RAM)", "m3-24vcpu-192gb-intel")
            .addOption("Memory-Optimized 3x SSD Intel (32 vCPU, 256GB RAM)", "m3-32vcpu-256gb-intel")
            .addOption("Memory-Optimized 3x SSD Intel (48 vCPU, 384GB RAM)", "m3-48vcpu-384gb-intel")

            // Memory-Optimized 6x SSD
            .addOption("Memory-Optimized 6x SSD (2 vCPU, 16GB RAM)", "m6-2vcpu-16gb")
            .addOption("Memory-Optimized 6x SSD (4 vCPU, 32GB RAM)", "m6-4vcpu-32gb")
            .addOption("Memory-Optimized 6x SSD (8 vCPU, 64GB RAM)", "m6-8vcpu-64gb")
            .addOption("Memory-Optimized 6x SSD (16 vCPU, 128GB RAM)", "m6-16vcpu-128gb")
            .addOption("Memory-Optimized 6x SSD (24 vCPU, 192GB RAM)", "m6-24vcpu-192gb")
            .addOption("Memory-Optimized 6x SSD (32 vCPU, 256GB RAM)", "m6-32vcpu-256gb")

            // Storage-Optimized
            .addOption("Storage-Optimized (2 vCPU, 16GB RAM)", "so-2vcpu-16gb")
            .addOption("Storage-Optimized (4 vCPU, 32GB RAM)", "so-4vcpu-32gb")
            .addOption("Storage-Optimized (8 vCPU, 64GB RAM)", "so-8vcpu-64gb")
            .addOption("Storage-Optimized (16 vCPU, 128GB RAM)", "so-16vcpu-128gb")
            .addOption("Storage-Optimized (24 vCPU, 192GB RAM)", "so-24vcpu-192gb")
            .addOption("Storage-Optimized (32 vCPU, 256GB RAM)", "so-32vcpu-256gb")
            .addOption("Storage-Optimized (48 vCPU, 384GB RAM)", "so-48vcpu-384gb")

            // Storage-Optimized Premium Intel
            .addOption("Storage-Optimized Intel (2 vCPU, 16GB RAM)", "so-2vcpu-16gb-intel")
            .addOption("Storage-Optimized Intel (4 vCPU, 32GB RAM)", "so-4vcpu-32gb-intel")
            .addOption("Storage-Optimized Intel (8 vCPU, 64GB RAM)", "so-8vcpu-64gb-intel")
            .addOption("Storage-Optimized Intel (16 vCPU, 128GB RAM)", "so-16vcpu-128gb-intel")
            .addOption("Storage-Optimized Intel (24 vCPU, 192GB RAM)", "so-24vcpu-192gb-intel")
            .addOption("Storage-Optimized Intel (32 vCPU, 256GB RAM)", "so-32vcpu-256gb-intel")
            .addOption("Storage-Optimized Intel (48 vCPU, 384GB RAM)", "so-48vcpu-384gb-intel")

            // Storage-Optimized 1.5x SSD
            .addOption("Storage-Optimized 1.5x SSD (2 vCPU, 16GB RAM)", "so1_5-2vcpu-16gb")
            .addOption("Storage-Optimized 1.5x SSD (4 vCPU, 32GB RAM)", "so1_5-4vcpu-32gb")
            .addOption("Storage-Optimized 1.5x SSD (8 vCPU, 64GB RAM)", "so1_5-8vcpu-64gb")
            .addOption("Storage-Optimized 1.5x SSD (16 vCPU, 128GB RAM)", "so1_5-16vcpu-128gb")
            .addOption("Storage-Optimized 1.5x SSD (24 vCPU, 192GB RAM)", "so1_5-24vcpu-192gb")
            .addOption("Storage-Optimized 1.5x SSD (32 vCPU, 256GB RAM)", "so1_5-32vcpu-256gb")

            // Storage-Optimized 1.5x SSD Premium Intel
            .addOption("Storage-Optimized 1.5x SSD Intel (2 vCPU, 16GB RAM)", "so1_5-2vcpu-16gb-intel")
            .addOption("Storage-Optimized 1.5x SSD Intel (4 vCPU, 32GB RAM)", "so1_5-4vcpu-32gb-intel")
            .addOption("Storage-Optimized 1.5x SSD Intel (8 vCPU, 64GB RAM)", "so1_5-8vcpu-64gb-intel")
            .addOption("Storage-Optimized 1.5x SSD Intel (16 vCPU, 128GB RAM)", "so1_5-16vcpu-128gb-intel")
            .addOption("Storage-Optimized 1.5x SSD Intel (24 vCPU, 192GB RAM)", "so1_5-24vcpu-192gb-intel")
            .addOption("Storage-Optimized 1.5x SSD Intel (32 vCPU, 256GB RAM)", "so1_5-32vcpu-256gb-intel")

            // GPU Droplets
            .addOption("GPU RTX 4000 Ada (8 vCPU, 32GB RAM, 20GB VRAM)", "gpu-4000adax1-20gb")
            .addOption("GPU L40S (8 vCPU, 64GB RAM, 48GB VRAM)", "gpu-l40sx1-48gb")
            .addOption("GPU RTX 6000 Ada (8 vCPU, 64GB RAM, 48GB VRAM)", "gpu-6000adax1-48gb")
            .addOption("GPU AMD MI300X 1X (20 vCPU, 240GB RAM, 192GB VRAM)", "gpu-mi300x1-192gb")
            .addOption("GPU H100 1X (20 vCPU, 240GB RAM, 80GB VRAM)", "gpu-h100x1-80gb")
            .addOption("GPU H200 1X (24 vCPU, 240GB RAM, 141GB VRAM)", "gpu-h200x1-141gb")
            .addOption("GPU AMD MI300X 8X (160 vCPU, 1920GB RAM, 1536GB VRAM)", "gpu-mi300x8-1536gb")
            .addOption("GPU H100 8X (160 vCPU, 1920GB RAM, 640GB VRAM)", "gpu-h100x8-640gb")
            .addOption("GPU H200 8X (192 vCPU, 1920GB RAM, 1128GB VRAM)", "gpu-h200x8-1128gb").build())
        .setValidationFormat(Joi.string().required())
        .setDocumentation("The slug identifier for the size that you wish to select for this Droplet. Only one of Name, Size or Image can be updated at a time")
        .build();

    // Image property
    const imageProp = new PropBuilder()
        .setName("image")
        .setKind("string")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("comboBox")
            .addOption("Ubuntu 22.04 (LTS) x64", "ubuntu-22-04-x64")
            .addOption("Ubuntu 24.04 (LTS) x64", "ubuntu-24-04-x64")
            .addOption("Ubuntu 25.04 x64", "ubuntu-25-04-x64")
            .addOption("Ubuntu 25.10 x64", "ubuntu-25-10-x64")
            .addOption("Debian 12 x64", "debian-12-x64")
            .addOption("Debian 13 x64", "debian-13-x64")
            .addOption("AlmaLinux 8 x64", "almalinux-8-x64")
            .addOption("AlmaLinux 9 x64", "almalinux-9-x64")
            .addOption("AlmaLinux 10 x64", "almalinux-10-x64")
            .addOption("CentOS 9 Stream x64", "centos-stream-9-x64")
            .addOption("CentOS 10 Stream x64", "centos-stream-10-x64")
            .addOption("Fedora 42 x64", "fedora-42-x64")
            .addOption("Rocky Linux 8 x64", "rockylinux-8-x64")
            .addOption("Rocky Linux 9 x64", "rockylinux-9-x64")
            .addOption("Rocky Linux 10 x64", "rockylinux-10-x64")
            .addOption("Ubuntu AMD AI/ML Ready", "gpu-amd-base")
            .addOption("Ubuntu NVIDIA AI/ML Ready", "gpu-h100x1-base")
            .addOption("Ubuntu NVIDIA AI/ML Ready with NVLink", "gpu-h100x8-base").build())
        .setValidationFormat(Joi.alternatives().try(Joi.string(), Joi.number().integer()).required())
        .setDocumentation("The image ID of a public or private image or the slug identifier for a public image. This image will be the base image for your Droplet. Requires `image:read` scope. If you are re-sizing your Droplet, you need to turn it off first. Only one of Name, Size or Image can be updated at a time")
        .build();

    // SSH Keys property
    const sshKeysProp = new PropBuilder()
        .setName("ssh_keys")
        .setKind("array")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("array")
            .setCreateOnly()
            .build())
        .setEntry(
            new PropBuilder()
            .setName("ssh_keys_item")
            .setKind("string")
            .setWidget(new PropWidgetDefinitionBuilder().setKind("text").build())
            .setValidationFormat(Joi.alternatives().try(Joi.number().integer(), Joi.string()))
            .setDocumentation("SSH key ID (integer) or fingerprint (string)")
            .build()
        )
        .setValidationFormat(Joi.array().items(Joi.alternatives().try(Joi.number().integer(), Joi.string())).default([]))
        .setDocumentation("An array containing the IDs or fingerprints of the SSH keys that you wish to embed in the Droplet's root account upon creation. You must add the keys to your team before they can be embedded on a Droplet. Requires `ssh_key:read` scope.")
        .build();

    // Backups property
    const backupsProp = new PropBuilder()
        .setName("backups")
        .setKind("boolean")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("checkbox")
            .setCreateOnly()
            .build())
        .setValidationFormat(Joi.boolean().default(false))
        .setDocumentation("A boolean indicating whether automated backups should be enabled for the Droplet.")
        .build();

    // IPv6 property
    const ipv6Prop = new PropBuilder()
        .setName("ipv6")
        .setKind("boolean")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("checkbox")
            .setCreateOnly()
            .build())
        .setValidationFormat(Joi.boolean().default(false))
        .setDocumentation("A boolean indicating whether to enable IPv6 on the Droplet.")
        .build();

    // Monitoring property
    const monitoringProp = new PropBuilder()
        .setName("monitoring")
        .setKind("boolean")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("checkbox")
            .setCreateOnly()
            .build())
        .setValidationFormat(Joi.boolean().default(false))
        .setDocumentation("A boolean indicating whether to install the DigitalOcean agent for monitoring.")
        .build();

    // Tags property
    const tagsProp = new PropBuilder()
        .setName("tags")
        .setKind("array")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("array")
            .setCreateOnly()
            .build())
        .setEntry(
            new PropBuilder()
            .setName("tags_item")
            .setKind("string")
            .setWidget(new PropWidgetDefinitionBuilder().setKind("text").build())
            .setValidationFormat(Joi.string())
            .build()
        )
        .setValidationFormat(Joi.array().items(Joi.string()).default([]))
        .setDocumentation("A flat array of tag names as strings to apply to the Droplet after it is created. Tag names can either be existing or new tags. Requires `tag:create` scope.")
        .build();

    // User data property
    const userDataProp = new PropBuilder()
        .setName("user_data")
        .setKind("string")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("codeEditor")
            .setCreateOnly()
            .build())
        .setValidationFormat(Joi.string().max(65536))
        .setDocumentation("A string containing 'user data' which may be used to configure the Droplet on first boot, often a 'cloud-config' file or Bash script. It must be plain text and may not exceed 64 KiB in size.")
        .build();

    // Volumes property
    const volumesProp = new PropBuilder()
        .setName("volumes")
        .setKind("array")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("array")
            .setCreateOnly()
            .build())
        .setEntry(
            new PropBuilder()
            .setName("volumes_item")
            .setKind("string")
            .setWidget(new PropWidgetDefinitionBuilder().setKind("text").build())
            .setValidationFormat(Joi.string())
            .setDocumentation("Volume ID")
            .build()
        )
        .setValidationFormat(Joi.array().items(Joi.string()).default([]))
        .setDocumentation("An array of IDs for block storage volumes that will be attached to the Droplet once created. The volumes must not already be attached to an existing Droplet. Requires `block_storage:read` scope.")
        .build();

    // VPC UUID property
    const vpcUuidProp = new PropBuilder()
        .setName("vpc_uuid")
        .setKind("string")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("text")
            .setCreateOnly()
            .build())
        .setValidationFormat(Joi.string().uuid())
        .setDocumentation("A string specifying the UUID of the VPC to which the Droplet will be assigned. If excluded, the Droplet will be assigned to your account's default VPC for the region. Requires `vpc:read` scope.")
        .build();

    // With Droplet Agent property
    const withDropletAgentProp = new PropBuilder()
        .setName("with_droplet_agent")
        .setKind("boolean")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("checkbox")
            .setCreateOnly()
            .build())
        .setValidationFormat(Joi.boolean().default(true))
        .setDocumentation("A boolean indicating whether to install the DigitalOcean agent used for providing access to the Droplet web console in the control panel. By default, the agent is installed on new Droplets if supported for the image. Otherwise, it isn't. To prevent it from being installed, set to `false`. To make installation errors fatal, explicitly set it to `true`.")
        .build();

    // Resource Properties (API-generated output properties)
    const idProp = new PropBuilder()
        .setName("id")
        .setKind("float")
        .setValidationFormat(Joi.number().integer())
        .setDocumentation("A unique identifier for each Droplet instance. This is automatically generated upon Droplet creation.")
        .build();

    const statusProp = new PropBuilder()
        .setName("status")
        .setKind("string")
        .setDocumentation("A status string indicating the state of a Droplet. This may be 'new', 'active', 'off', or 'archive'.")
        .build();

    const createdAtProp = new PropBuilder()
        .setName("created_at")
        .setKind("string")
        .setDocumentation("A time value given in ISO8601 combined date and time format that represents when the Droplet was created.")
        .build();

    const memoryProp = new PropBuilder()
        .setName("memory")
        .setKind("float")
        .setValidationFormat(Joi.number().integer())
        .setDocumentation("Memory of the Droplet in megabytes.")
        .build();

    const vcpusProp = new PropBuilder()
        .setName("vcpus")
        .setKind("float")
        .setValidationFormat(Joi.number().integer())
        .setDocumentation("The number of virtual CPUs in a Droplet.")
        .build();

    const diskProp = new PropBuilder()
        .setName("disk")
        .setKind("float")
        .setValidationFormat(Joi.number().integer())
        .setDocumentation("The size of the Droplet's disk in gigabytes.")
        .build();

    const lockedProp = new PropBuilder()
        .setName("locked")
        .setKind("boolean")
        .setDocumentation("A boolean value indicating whether the Droplet has been locked, preventing actions by users.")
        .build();

    const snapshotIdsProp = new PropBuilder()
        .setName("snapshot_ids")
        .setKind("array")
        .setEntry(
            new PropBuilder()
            .setName("snapshot_ids_item")
            .setKind("float")
            .build()
        )
        .setDocumentation("An array of snapshot IDs of any snapshots created from the Droplet instance.")
        .build();

    const featuresProp = new PropBuilder()
        .setName("features")
        .setKind("array")
        .setEntry(
            new PropBuilder()
            .setName("features_item")
            .setKind("string")
            .build()
        )
        .setDocumentation("An array of features enabled on this Droplet.")
        .build();

    const sizeSlugProp = new PropBuilder()
        .setName("size_slug")
        .setKind("string")
        .setDocumentation("The unique slug identifier for the size of this Droplet.")
        .build();



    const volumeIdsProp = new PropBuilder()
        .setName("volume_ids")
        .setKind("array")
        .setEntry(
            new PropBuilder()
            .setName("volume_ids_item")
            .setKind("string")
            .build()
        )
        .setDocumentation("A flat array including the unique identifier for each Block Storage volume attached to the Droplet.")
        .build();

    const extraProp = new PropBuilder()
        .setName("extra")
        .setKind("object")
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("header")
            .build()
        )
        .addChild(
            new PropBuilder()
            .setName("snapshot")
            .setKind("string")
            .setWidget(new PropWidgetDefinitionBuilder()
                .setKind("text")
                .build())
            .setDocumentation("Update Only. Create a snapshot of the droplet.")
            .build()
        )
        .addChild(
            new PropBuilder()
            .setName("restore")
            .setKind("string")
            .setWidget(new PropWidgetDefinitionBuilder()
                .setKind("text")
                .build())
            .setDocumentation("Update Only. Restore a Droplet using a backup image. The image ID that is passed in must be a backup of the current Droplet instance. The operation will leave any embedded SSH keys intact.")
            .build()
        )
        .build();

    // Create the asset
    const asset = new AssetBuilder()
        .addProp(nameProp)
        .addProp(regionProp)
        .addProp(sizeProp)
        .addProp(imageProp)
        .addProp(sshKeysProp)
        .addProp(backupsProp)
        .addProp(ipv6Prop)
        .addProp(monitoringProp)
        .addProp(tagsProp)
        .addProp(userDataProp)
        .addProp(volumesProp)
        .addProp(vpcUuidProp)
        .addProp(withDropletAgentProp)
        .addProp(extraProp)
        .addResourceProp(idProp)
        .addResourceProp(statusProp)
        .addResourceProp(createdAtProp)
        .addResourceProp(memoryProp)
        .addResourceProp(vcpusProp)
        .addResourceProp(diskProp)
        .addResourceProp(lockedProp)
        .addResourceProp(snapshotIdsProp)
        .addResourceProp(featuresProp)
        .addResourceProp(sizeSlugProp)
        .addResourceProp(volumeIdsProp)
        .addSecretProp(DOCredentialSecretProp)
        .build();

    return asset;
}
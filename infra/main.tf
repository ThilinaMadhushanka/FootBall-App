terraform {
  required_version = ">= 1.6, < 2.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.59"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

variable "subscription_id" {
  type = string
}

variable "acr_name" {
  type = string
}

variable "location" {
  type    = string
  default = "southindia"
}

variable "prefix" {
  type    = string
  default = "playerpro-lab"
}

variable "node_size" {
  type    = string
  default = "Standard_D4s_v5"
}

resource "azurerm_resource_group" "lab" {
  name     = "${var.prefix}-rg"
  location = var.location
}

resource "azurerm_virtual_network" "lab" {
  name                = "${var.prefix}-vnet"
  location            = var.location
  resource_group_name = azurerm_resource_group.lab.name
  address_space       = ["10.20.0.0/16"]
}

resource "azurerm_subnet" "aks" {
  name                 = "aks"
  resource_group_name  = azurerm_resource_group.lab.name
  virtual_network_name = azurerm_virtual_network.lab.name
  address_prefixes     = ["10.20.0.0/22"]
}

resource "azurerm_user_assigned_identity" "aks" {
  name                = "${var.prefix}-identity"
  location            = var.location
  resource_group_name = azurerm_resource_group.lab.name
}

resource "azurerm_role_assignment" "network" {
  scope                = azurerm_subnet.aks.id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_user_assigned_identity.aks.principal_id
}

resource "azurerm_container_registry" "lab" {
  name                = var.acr_name
  location            = var.location
  resource_group_name = azurerm_resource_group.lab.name
  sku                 = "Basic"
  admin_enabled       = false
}

resource "azurerm_kubernetes_cluster" "lab" {
  name                = "${var.prefix}-aks"
  location            = var.location
  resource_group_name = azurerm_resource_group.lab.name
  dns_prefix          = var.prefix

  # Short-lived lab: no automatic Kubernetes upgrade channel configured.
  node_os_upgrade_channel           = "None"
  sku_tier                          = "Free"
  role_based_access_control_enabled = true

  default_node_pool {
    name            = "system"
    node_count      = 1
    vm_size         = var.node_size
    os_disk_size_gb = 128
    os_disk_type    = "Managed"
    vnet_subnet_id  = azurerm_subnet.aks.id
    os_sku          = "Ubuntu"

    upgrade_settings {
      max_surge = "1"
    }
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.aks.id]
  }

  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay"
    pod_cidr            = "10.244.0.0/16"
    service_cidr        = "10.30.0.0/16"
    dns_service_ip      = "10.30.0.10"
    load_balancer_sku   = "standard"
    outbound_type       = "loadBalancer"
  }

  depends_on = [azurerm_role_assignment.network]
}

resource "azurerm_role_assignment" "pull" {
  scope                = azurerm_container_registry.lab.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.lab.kubelet_identity[0].object_id

  skip_service_principal_aad_check = true
}

output "resource_group" {
  value = azurerm_resource_group.lab.name
}

output "aks_name" {
  value = azurerm_kubernetes_cluster.lab.name
}

output "acr_name" {
  value = azurerm_container_registry.lab.name
}

output "acr_id" {
  value = azurerm_container_registry.lab.id
}

output "acr_server" {
  value = azurerm_container_registry.lab.login_server
}
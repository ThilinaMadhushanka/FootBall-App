variable "jenkins_location" {
  type    = string
  default = "centralindia"
}
variable "jenkins_zone" {
  type    = string
  default = "1"
}
resource "azurerm_virtual_network" "jenkins" {
  name                = "${var.prefix}-jenkins-vnet"
  location            = var.jenkins_location
  resource_group_name = azurerm_resource_group.lab.name
  address_space       = ["10.40.0.0/16"]
}
variable "jenkins_ssh_public_key_path" {
  type = string
}
variable "admin_ssh_cidr" {
  type        = string
  description = "Your current public IPv4 address with /32"
  validation {
    condition     = can(cidrhost(var.admin_ssh_cidr, 0)) && endswith(var.admin_ssh_cidr, "/32")
    error_message = "Use your public IPv4 /32, not a public-wide SSH rule."
  }
}
resource "azurerm_subnet" "jenkins" {
  name                 = "jenkins"
  resource_group_name  = azurerm_resource_group.lab.name
  virtual_network_name = azurerm_virtual_network.jenkins.name
  address_prefixes     = ["10.40.1.0/24"]
}
resource "azurerm_public_ip" "jenkins" {
  name                = "${var.prefix}-jenkins-ip"
  location            = var.jenkins_location
  resource_group_name = azurerm_resource_group.lab.name
  zones               = [var.jenkins_zone]
  allocation_method   = "Static"
  sku                 = "Standard"
}
resource "azurerm_network_security_group" "jenkins" {
  name                = "${var.prefix}-jenkins-nsg"
  location            = var.jenkins_location
  resource_group_name = azurerm_resource_group.lab.name
  security_rule {
    name                       = "SSHFromMyPC"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.admin_ssh_cidr
    destination_address_prefix = "*"
  }
}
resource "azurerm_network_interface" "jenkins" {
  name                = "${var.prefix}-jenkins-nic"
  location            = var.jenkins_location
  resource_group_name = azurerm_resource_group.lab.name
  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.jenkins.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.jenkins.id
  }
}
resource "azurerm_network_interface_security_group_association" "jenkins" {
  network_interface_id      = azurerm_network_interface.jenkins.id
  network_security_group_id = azurerm_network_security_group.jenkins.id
}
resource "azurerm_linux_virtual_machine" "jenkins" {
  name                            = "${var.prefix}-jenkins"
  location                        = var.jenkins_location
  resource_group_name             = azurerm_resource_group.lab.name
  zone                            = var.jenkins_zone
  size                            = "Standard_D4s_v5"
  admin_username                  = "azureuser"
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.jenkins.id]
  admin_ssh_key {
    username   = "azureuser"
    public_key = file(pathexpand(var.jenkins_ssh_public_key_path))
  }
  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
    disk_size_gb         = 64
  }
  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }
  depends_on = [azurerm_network_interface_security_group_association.jenkins]
}
output "jenkins_ip" {
  value = azurerm_public_ip.jenkins.ip_address
}
output "jenkins_vm_name" {
  value = azurerm_linux_virtual_machine.jenkins.name
}

import { Customer } from '../models';
import { storageService } from './storage.service';

class CustomerService {
  async getCustomers(): Promise<Customer[]> {
    return await storageService.getCustomers();
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const customer: Customer = {
      ...data,
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const customers = await this.getCustomers();
    customers.push(customer);
    await storageService.saveCustomers(customers);
    return customer;
  }

  async updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    const customers = await this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cliente no encontrado');

    const updatedCustomer = {
      ...customers[index],
      ...data,
      updatedAt: Date.now(),
    };

    customers[index] = updatedCustomer;
    await storageService.saveCustomers(customers);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customers = await this.getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    await storageService.saveCustomers(filtered);
  }

  async findByIdCard(idCard: string): Promise<Customer | undefined> {
    const customers = await this.getCustomers();
    return customers.find(c => c.idCard === idCard);
  }
}

export const customerService = new CustomerService();

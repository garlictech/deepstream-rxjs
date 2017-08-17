import { EventEmitter } from 'events';

export interface ITestRecord {
  id: string;
  name: string;
  extra?: string;
};

export interface ITestRecords {
  [id: string]: ITestRecord
}

export class TestDB extends EventEmitter {
  public records: ITestRecords = {
    'test/1': {
      id: 'test1',
      name: 'test1'
    },
    
    'test/2': {
      id: 'test2',
      name: 'test2'
    }
  };

  public list: string[] = [
    '1',
    '2'
  ];

  set(path, value): void {
    this.records[path] = value;
    this.emit('record.changed', path, value);
  }  
    
  setValue(path, field, value): void {
    this.records[path] = this.records[path] || {
      id: path,
      name: ''
    };
    
    this.records[path][field] = value;
    this.emit('record.changed', path, this.records[path]);
  }

  get(path): ITestRecord {
    return this.records[path];
  }

  addEntry(id): void {
    this.list.push(id);
    this.emit('list.changed', this.list);
  }

  getList(): string[] {
    return this.list;
  }  
}

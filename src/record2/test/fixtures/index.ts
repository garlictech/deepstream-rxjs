import { EventEmitter } from 'events';
import * as _ from 'lodash';

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
      id: '1',
      name: 'test1'
    },
    
    'test/2': {
      id: '2',
      name: 'test2'
    },

    'test/3': {
      id: '3',
      name: 'foobar'
    }
  };

  public list: string[] = [
    'test/1',
    'test/2',
    'test/3'
  ];

  set(path: string, value: ITestRecord): void {
    this.records[path] = value;
    this.emit('record.changed', path, value);
  }  
    
  setValue(path: string, field: string, value: string | number | boolean): void {
    let id = this.records[path].id;
    
    this.records[path][field] = value;
    this.emit(`record.changed.${id}`, path, this.records[path]);
  }

  get(path): ITestRecord {
    return this.records[path];
  }

  addEntry(id: string): void {
    this.list.push(id);
    this.emit('list.changed', this.list);
  }

  getList(path: string): string[] {
    let list = this.list;
    let table = path;
    let isQuery = (path.match(/^search\?/) !== null);

    if (isQuery === true) {
      let json  = path.replace(/^search\?/, '');
      let query = JSON.parse(json);
      let pattern = new RegExp(query.query[0][2]);

      list = _
        .filter(this.records, record => pattern.test(record.name))
        .map(record => record.id);

      table = query.table;
    }

    return list;
  }  
}

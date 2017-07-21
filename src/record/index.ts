import { Observable } from 'rxjs';

export class Record {
  public constructor(private dsClient) {}

  public list(path: string): Observable<any[]> {
    let list = this.dsClient.record.getList(path);
    let list$;

    list.subscribe(() => {

    }, true);

    return list$;


  }
};

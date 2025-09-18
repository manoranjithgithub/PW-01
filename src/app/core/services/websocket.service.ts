import { Injectable } from '@angular/core';
import { Observable, Observer, Subject } from 'rxjs';
import { AnonymousSubject } from 'rxjs/internal/Subject';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';



export interface Message {
  source: string;
  content: string;
}

@Injectable()
export class WebsocketService {
  private subject!: AnonymousSubject<MessageEvent>;
  public messages: Subject<Message>;

  constructor() {
    this.messages = (this.connect(environment.wss).pipe(
      map(
        (response: MessageEvent): Message => {
          return response.data;
        }
      )
    ) as Subject<Message>);
  }

  public connect(url:any): AnonymousSubject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
    }
    return this.subject;
  }

  private create(url:any): AnonymousSubject<MessageEvent> {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      const userId = localStorage.getItem('userId') ?? '';
      ws.send(userId);
    });
    const observable = new Observable((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });
    const observer = {
      error: (err: any) => {
        console.error('WebSocket error:', err);
      },
      complete: () => {
        console.log('WebSocket connection closed');
      },
      next: (data: object) => {
        console.log('Message sent to websocket: ', data);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    };
    return new AnonymousSubject<MessageEvent>(observer, observable);
  }
}

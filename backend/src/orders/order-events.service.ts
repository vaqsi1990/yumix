import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type OrderLiveEvent = {
  orderId: string;
  type: 'STATUS' | 'LOCATION';
  status?: string;
  courierLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  at: string;
};

@Injectable()
export class OrderEventsService {
  private readonly channels = new Map<string, Subject<OrderLiveEvent>>();

  private channel(orderId: string) {
    let subject = this.channels.get(orderId);
    if (!subject) {
      subject = new Subject<OrderLiveEvent>();
      this.channels.set(orderId, subject);
    }
    return subject;
  }

  emit(event: OrderLiveEvent) {
    this.channel(event.orderId).next(event);
  }

  subscribe(orderId: string, listener: (event: OrderLiveEvent) => void) {
    const subject = this.channel(orderId);
    const sub = subject.subscribe(listener);
    return () => sub.unsubscribe();
  }
}

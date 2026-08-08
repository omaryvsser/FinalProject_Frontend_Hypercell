import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentResultDto, ProcessPaymentRequest } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  processPayment(payload: ProcessPaymentRequest): Observable<PaymentResultDto> {
    return this.http.post<PaymentResultDto>(
      `${environment.apiUrl}/payments/process`,
      payload
    );
  }
}

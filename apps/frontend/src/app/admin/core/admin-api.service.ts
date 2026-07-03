import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResult } from './paginated-result.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  list<T>(
    resourcePath: string,
    params: Record<string, string | number | undefined> = {},
  ): Observable<PaginatedResult<T>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResult<T>>(
      `${this.baseUrl}/${resourcePath}`,
      { params: httpParams },
    );
  }

  getById<T>(resourcePath: string, id: number | string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${resourcePath}/${id}`);
  }

  create<T>(resourcePath: string, dto: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${resourcePath}`, dto);
  }

  update<T>(
    resourcePath: string,
    id: number | string,
    dto: unknown,
  ): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${resourcePath}/${id}`, dto);
  }

  remove(resourcePath: string, id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${resourcePath}/${id}`);
  }
}

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { Router } from "@angular/router";
import { User } from "../models/models";

const API = "http://localhost:3000/api";

@Injectable({ providedIn: "root" })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.loadUser());
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  private loadUser(): User | null {
    const stored = localStorage.getItem("transitops_user");
    return stored ? JSON.parse(stored) : null;
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }
  get token(): string | null {
    return localStorage.getItem("transitops_token");
  }
  get isLoggedIn(): boolean {
    return !!this.token;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${API}/auth/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem("transitops_token", res.token);
        localStorage.setItem("transitops_user", JSON.stringify(res.user));
        this.userSubject.next(res.user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
    this.userSubject.next(null);
    this.router.navigate(["/login"]);
  }

  hasRole(...roles: string[]): boolean {
    return !!this.currentUser && roles.includes(this.currentUser.role);
  }
}

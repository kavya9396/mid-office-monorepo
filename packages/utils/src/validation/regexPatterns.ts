export class RegexPatterns {
  static readonly userId = /^[A-Za-z]+\d+$/;
  static readonly password = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,}$/;
}

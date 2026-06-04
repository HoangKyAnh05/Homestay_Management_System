import LoginForm from '../../components/LoginForm/LoginForm'
import LoginHero from '../../components/LoginHero/LoginHero'
import './LoginPage.css'

function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Đăng nhập Lagom House">
        <LoginHero />
        <section className="form-panel" aria-labelledby="login-title">
          <LoginForm />
        </section>
      </section>
    </main>
  )
}

export default LoginPage

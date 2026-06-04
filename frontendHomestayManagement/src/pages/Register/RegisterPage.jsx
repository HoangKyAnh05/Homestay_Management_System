import LoginHero from '../../components/LoginHero/LoginHero'
import RegisterForm from '../../components/RegisterForm/RegisterForm'
import './RegisterPage.css'

function RegisterPage() {
  return (
    <main className="login-page register-page">
      <section className="login-shell register-shell" aria-label="Đăng ký tài khoản HomeStay">
        <LoginHero />
        <section className="form-panel" aria-labelledby="register-title">
          <RegisterForm />
        </section>
      </section>
    </main>
  )
}

export default RegisterPage

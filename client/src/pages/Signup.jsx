import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Signup.css'
import { apiFetch } from '../utils/apiClient'

function Signup() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: ''
  });

  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAgreementChange = (type) => {
    if (type === 'all') {
      const newValue = !agreements.all;
      setAgreements({
        all: newValue,
        terms: newValue,
        privacy: newValue,
        marketing: newValue
      });
    } else {
      setAgreements(prev => ({
        ...prev,
        [type]: !prev[type],
        all: false
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 8) {
      alert('비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    if (!agreements.terms || !agreements.privacy) {
      alert('필수 약관에 동의해주세요.');
      return;
    }

    try {
      const response = await apiFetch('users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          user_type: 'customer',
          address: formData.address || undefined
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || '회원가입 중 오류가 발생했습니다.');
      }

      alert('회원가입이 완료되었습니다!');
      console.log('User created:', data);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: ''
      });
      setAgreements({
        all: false,
        terms: false,
        privacy: false,
        marketing: false
      });

      // 홈으로 이동
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
      alert(error.message || '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h1>SIGN UP</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="홍길동"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="8자 이상 입력해주세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="비밀번호를 다시 입력해주세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">주소</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="선택사항입니다"
            />
          </div>

          <div className="agreement-section">
            <div className="agreement-item">
              <input
                type="checkbox"
                id="all"
                checked={agreements.all}
                onChange={() => handleAgreementChange('all')}
              />
              <label htmlFor="all">전체 동의</label>
            </div>

            <div className="agreement-sub-items">
              <div className="agreement-item">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreements.terms}
                  onChange={() => handleAgreementChange('terms')}
                />
                <label htmlFor="terms">[필수] 이용약관 동의</label>
              </div>

              <div className="agreement-item">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={agreements.privacy}
                  onChange={() => handleAgreementChange('privacy')}
                />
                <label htmlFor="privacy">[필수] 개인정보 수집 및 이용 동의</label>
              </div>

              <div className="agreement-item">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={agreements.marketing}
                  onChange={() => handleAgreementChange('marketing')}
                />
                <label htmlFor="marketing">[선택] 마케팅 정보 수신 동의</label>
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            회원가입
          </button>
        </form>

        <p className="login-link">
          이미 계정이 있으신가요? <a href="#login">로그인</a>
        </p>
      </div>
    </div>
  );
}

export default Signup


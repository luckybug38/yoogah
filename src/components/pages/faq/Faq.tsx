import React from "react";
import styles from "./Faq.module.css";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const faqData: FAQItem[] = [
  {
    question: "모의 인터뷰를 해야 하는 이유는 무엇일까요?",
    answer:
      "실제 면접에서는 혼자 공부할 때와 달리 긴장감이 훨씬 더 크고 예상치 못한 상황들이 많이 발생합니다. 면접이 끝난 후에는 무엇이 문제였는지, 어떤 점을 향상시켜야 할지 알기 어려운 경우가 많습니다. 모의 인터뷰를 통해 실제 면접을 경험하고 피드백을 받으면, 어떤 점을 보완해야 면접을 통과할 수 있을지 명확히 알 수 있습니다. 이 과정은 면접 준비에 큰 도움이 됩니다.",
  },
  {
    question: "환불을 받을 수 있나요?",
    answer: "서비스에 만족하지 않으셨다면 100% 환불해 드립니다.",
  },
  {
    question:
      "이 서비스가 왜 생겼나요? 다른 인터뷰 사이트도 많은데 이 서비스를 왜 사용해야 하나요?",
    answer:
      "저는 여러 모의 인터뷰 서비스에서 일해보면서, 한국인을 위한 서비스가 있으면 좋겠다고 느꼈고, 가격도 잘 알려진 사이트들보다 더 저렴하게 책정했습니다. 또한, 한인 엔지니어들과 소통하며 하나의 커뮤니티도 생성할 계획입니다. 이 서비스는 1:1 인터뷰뿐만 아니라, 더 저렴한 가격으로 제공되는 수업 형태의 세션도 계획하고 있습니다.",
  },
  {
    question: "세션은 영어로 진행되나요, 한국어로 하나요?",
    answer:
      "두 언어 모두 가능합니다. 첫 인사와 멘토링, 피드백은 한국어 또는 영어로 진행할 수 있습니다. 다만, 모의 인터뷰는 사용자가 한국어를 꼭 선호하지 않는 한, 영어로 진행하는 것이 좋습니다.",
  },
];

const Faq: React.FC = () => {
  return (
    <div className={styles.faqContainer}>
      <h1 className={styles.header}>자주 묻는 질문</h1>
      <div className={styles.faqList}>
        {faqData.map((faq, index) => (
          <div key={index} className={styles.faqItem}>
            <div className={styles.question}>{faq.question}</div>
            <div className={styles.answer}>{faq.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faq;

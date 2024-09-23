import { PostType } from "./AutocompleteInput";


const fetchTags = (mode: PostType) => {
  switch (mode) {
    case PostType.POST:
      return ['google','system design', 'meta', 'airbnb', 'netflix','slack','bloomberg','openai','anthropic','interview'];
    case PostType.DIARY:
      return ['결혼', '임신', '성별 공개', '탄생일', '백일', '목 가누기', '뒤집기', '되집기', '배밀이', '이유식', '첫 이가 남', '걸음마', '첫 "엄마"', '첫 "아빠"', '돌잔치', '첫 미용', '어린이집 첫 등원', '첫 비행'];
  }
};

export default fetchTags;
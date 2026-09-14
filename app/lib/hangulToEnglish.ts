// 한글 자모/음절을 표준 두벌식 키보드 매핑 기준으로 영어로 역변환하는 유틸리티
// 한/영 전환을 깜빡하고 이메일 등을 한글 자판 상태로 입력했을 때, 그 결과물을
// 원래 의도했던 영어 문자열로 되돌리는 용도

// 초성 19개 (유니코드 순서)
const CHOSEONG_MAP: Record<string, string> = {
  'ㄱ': 'r', 'ㄲ': 'R', 'ㄴ': 's', 'ㄷ': 'e', 'ㄸ': 'E',
  'ㄹ': 'f', 'ㅁ': 'a', 'ㅂ': 'q', 'ㅃ': 'Q', 'ㅅ': 't',
  'ㅆ': 'T', 'ㅇ': 'd', 'ㅈ': 'w', 'ㅉ': 'W', 'ㅊ': 'c',
  'ㅋ': 'z', 'ㅌ': 'x', 'ㅍ': 'v', 'ㅎ': 'g',
}

// 중성 21개 (유니코드 순서) - 복합모음은 두 키 조합
const JUNGSEONG_MAP: Record<string, string> = {
  'ㅏ': 'k', 'ㅐ': 'o', 'ㅑ': 'i', 'ㅒ': 'O', 'ㅓ': 'j',
  'ㅔ': 'p', 'ㅕ': 'u', 'ㅖ': 'P', 'ㅗ': 'h', 'ㅘ': 'hk',
  'ㅙ': 'ho', 'ㅚ': 'hl', 'ㅛ': 'y', 'ㅜ': 'n', 'ㅝ': 'nj',
  'ㅞ': 'np', 'ㅟ': 'nl', 'ㅠ': 'b', 'ㅡ': 'm', 'ㅢ': 'ml',
  'ㅣ': 'l',
}

// 종성 27개 (받침 없음 제외, 유니코드 순서) - 복합받침은 두 키 조합
const JONGSEONG_MAP: Record<string, string> = {
  'ㄱ': 'r', 'ㄲ': 'R', 'ㄳ': 'rt', 'ㄴ': 's', 'ㄵ': 'sw',
  'ㄶ': 'sg', 'ㄷ': 'e', 'ㄹ': 'f', 'ㄺ': 'fr', 'ㄻ': 'fa',
  'ㄼ': 'fq', 'ㄽ': 'ft', 'ㄾ': 'fx', 'ㄿ': 'fv', 'ㅀ': 'fg',
  'ㅁ': 'a', 'ㅂ': 'q', 'ㅄ': 'qt', 'ㅅ': 't', 'ㅆ': 'T',
  'ㅇ': 'd', 'ㅈ': 'w', 'ㅊ': 'c', 'ㅋ': 'z', 'ㅌ': 'x',
  'ㅍ': 'v', 'ㅎ': 'g',
}

// 종성 인덱스(0~27) -> 자모 문자
const JONGSEONG_LIST = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]
const CHOSEONG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]
const JUNGSEONG_LIST = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
]

const HANGUL_BASE = 0xac00
const HANGUL_END = 0xd7a3

// 완성형 한글 음절 1글자를 영어 키 시퀀스로 변환
function syllableToEnglish(code: number): string {
  const offset = code - HANGUL_BASE
  const choIdx = Math.floor(offset / (21 * 28))
  const jungIdx = Math.floor((offset % (21 * 28)) / 28)
  const jongIdx = offset % 28

  const cho = CHOSEONG_MAP[CHOSEONG_LIST[choIdx]] ?? ''
  const jung = JUNGSEONG_MAP[JUNGSEONG_LIST[jungIdx]] ?? ''
  const jong = jongIdx > 0 ? (JONGSEONG_MAP[JONGSEONG_LIST[jongIdx]] ?? '') : ''

  return cho + jung + jong
}

// 문자열 전체를 순회하며, 완성형 한글 음절/단독 자모는 영어로 변환하고 나머지는 그대로 둠
export function convertHangulToEnglish(input: string): string {
  let result = ''
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0
    if (code >= HANGUL_BASE && code <= HANGUL_END) {
      result += syllableToEnglish(code)
    } else if (CHOSEONG_MAP[char]) {
      // 단독 자음(받침 없이 자음만 입력된 상태)
      result += CHOSEONG_MAP[char]
    } else if (JUNGSEONG_MAP[char]) {
      // 단독 모음
      result += JUNGSEONG_MAP[char]
    } else {
      result += char
    }
  }
  return result
}

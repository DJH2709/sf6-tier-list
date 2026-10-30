import { CHARACTERS } from "@/lib/sf6";
import type { Locale } from "@/lib/i18n/config";

// Official Capcom names per language, from each character's page on streetfighter.com/6
// (checked 2026-10-30). Capcom's Korean and Chinese pages show the English names, so those
// languages use the English names too. Characters missing here show their English name.
const NAMES: Partial<Record<Locale, Record<string, string>>> = {
  ja: {
    "ryu": "リュウ",
    "luke": "ルーク",
    "jamie": "ジェイミー",
    "chun-li": "春麗",
    "guile": "ガイル",
    "kimberly": "キンバリー",
    "juri": "ジュリ",
    "ken": "ケン",
    "blanka": "ブランカ",
    "dhalsim": "ダルシム",
    "e-honda": "エドモンド本田",
    "dee-jay": "ディージェイ",
    "manon": "マノン",
    "marisa": "マリーザ",
    "jp": "JP",
    "zangief": "ザンギエフ",
    "lily": "リリー",
    "cammy": "キャミィ",
    "rashid": "ラシード",
    "a-k-i": "A.K.I.",
    "ed": "ED",
    "akuma": "豪鬼",
    "m-bison": "ベガ",
    "terry": "テリー",
    "mai": "舞",
    "elena": "エレナ",
    "sagat": "サガット",
    "c-viper": "C.ヴァイパー",
    "alex": "アレックス",
    "ingrid": "イングリッド",
    "yasmine": "ヤスミン",
    "arjun": "アルジュン",
  },
};

export function characterName(id: string, locale: Locale = "en") {
  return NAMES[locale]?.[id] ?? CHARACTERS.find((c) => c.id === id)?.name ?? id;
}

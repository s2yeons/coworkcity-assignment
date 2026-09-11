"""
테스트용 가상 사업자등록증 이미지 생성기 (개인정보 없는 가상 정보).
실행: python3 generate.py   (Pillow 필요, macOS 기본 한글 폰트 사용)
생성된 PNG/JPG는 레포에 커밋되어 있어 채점 시 다시 실행할 필요는 없습니다.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, random

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
W, H = 1240, 1754  # A4 @150dpi


def font(size, index=4):  # index 4 ≈ Regular, 6 ≈ Bold in AppleSDGothicNeo.ttc
    try:
        return ImageFont.truetype(FONT, size, index=index)
    except Exception:
        return ImageFont.truetype(FONT, size)


def biz_number(prefix9):
    """사업자등록번호 검증 자리(10번째) 계산"""
    d = [int(c) for c in prefix9]
    w = [1, 3, 7, 1, 3, 7, 1, 3, 5]
    s = sum(a * b for a, b in zip(d, w)) + (d[8] * 5) // 10
    check = (10 - s % 10) % 10
    n = prefix9 + str(check)
    return f"{n[:3]}-{n[3:5]}-{n[5:]}"


SAMPLES = [
    {
        "file": "individual-seoul-ecommerce.png",
        "kind": "( 일반과세자 )",
        "number": biz_number("123456789"),
        "corp_number": None,
        "name": "코워크샘플상사",
        "owner": "홍길동",
        "opened": "2022 년 03 월 02 일",
        "address": "서울특별시 마포구 양화로 100, 5층 501호 (서교동)",
        "hq": None,
        "biz": [("도매 및 소매업", "전자상거래 소매업"), ("도매 및 소매업", "통신판매업")],
        "issued": "2025 년 01 월 15 일",
        "office": "마 포 세 무 서 장",
        "photo": False,
    },
    {
        "file": "corporate-gyeonggi-software.png",
        "kind": "( 법인사업자 )",
        "number": biz_number("220879103"),
        "corp_number": "110111-1234567",
        "name": "주식회사 샘플소프트",
        "owner": "김테스트",
        "opened": "2021 년 07 월 19 일",
        "address": "경기도 성남시 분당구 판교역로 200, 3층 (삼평동)",
        "hq": "경기도 성남시 분당구 판교역로 200, 3층 (삼평동)",
        "biz": [("정보통신업", "응용 소프트웨어 개발 및 공급업"), ("정보통신업", "포털 및 기타 인터넷 정보매개 서비스업")],
        "issued": "2025 년 02 월 03 일",
        "office": "분 당 세 무 서 장",
        "photo": False,
    },
    {
        "file": "individual-busan-design-photo.jpg",
        "kind": "( 간이과세자 )",
        "number": biz_number("617129013"),
        "corp_number": None,
        "name": "샘플디자인",
        "owner": "이가상",
        "opened": "2023 년 11 월 06 일",
        "address": "부산광역시 해운대구 센텀중앙로 55, 8층 (우동)",
        "hq": None,
        "biz": [("전문, 과학 및 기술 서비스업", "시각 디자인업"), ("전문, 과학 및 기술 서비스업", "사진 촬영업")],
        "issued": "2025 년 03 월 21 일",
        "office": "해 운 대 세 무 서 장",
        "photo": True,
    },
]


def render(s):
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    d.rectangle([40, 40, W - 40, H - 40], outline=(120, 120, 120), width=4)
    d.rectangle([52, 52, W - 52, H - 52], outline=(120, 120, 120), width=1)

    d.text((W / 2, 150), "사 업 자 등 록 증", font=font(64, 6), fill="black", anchor="mm")
    d.text((W / 2, 225), s["kind"], font=font(34), fill="black", anchor="mm")
    d.text((W / 2, 285), f"등록번호 : {s['number']}", font=font(36), fill="black", anchor="mm")

    y = 400
    # 실제 서식: 개인사업자는 "상 호 / 성 명", 법인사업자는 "법인명(단체명) / 대 표 자"
    is_corp = s["corp_number"] is not None
    rows = [
        ("법인명(단체명)" if is_corp else "상     호", s["name"]),
        ("대  표  자" if is_corp else "성     명", s["owner"]),
    ]
    if s["corp_number"]:
        rows.append(("법인등록번호", s["corp_number"]))
    rows += [
        ("개 업 연 월 일", s["opened"]),
        ("사업장 소재지", s["address"]),
    ]
    if s["hq"]:
        rows.append(("본 점 소 재 지", s["hq"]))
    f_label, f_val = font(32), font(32)
    for label, val in rows:
        d.text((110, y), f"{label} :", font=f_label, fill="black")
        d.text((420, y), val, font=f_val, fill="black")
        y += 66

    # 사업의 종류 (업태 / 종목 표)
    y += 20
    d.text((110, y), "사 업 의 종 류 :", font=f_label, fill="black")
    d.text((420, y), "업태", font=font(30, 6), fill="black")
    d.text((780, y), "종목", font=font(30, 6), fill="black")
    y += 52
    for kind, item in s["biz"]:
        d.text((420, y), kind, font=font(30), fill="black")
        d.text((780, y), item, font=font(30), fill="black")
        y += 50

    y += 40
    for label, val in [
        ("발 급 사 유", "신규"),
        ("공동사업자", ""),
        ("사업자 단위 과세 적용사업자 여부", "여(  )  부( V )"),
        ("전자세금계산서 전용 전자우편주소", "sample@example.com"),
    ]:
        d.text((110, y), f"{label} :", font=font(28), fill="black")
        d.text((640, y), val, font=font(28), fill="black")
        y += 58

    d.text((W / 2, H - 330), s["issued"], font=font(34), fill="black", anchor="mm")
    d.text((W / 2, H - 240), s["office"], font=font(52, 6), fill="black", anchor="mm")
    d.ellipse([W / 2 + 200, H - 330, W / 2 + 340, H - 190], outline=(200, 40, 40), width=5)
    d.text((W / 2 + 270, H - 260), "직인", font=font(30), fill=(200, 40, 40), anchor="mm")
    d.text((W / 2, H - 110), "※ 테스트용 가상 사업자등록증입니다. 실제 사업자와 무관합니다.", font=font(22), fill=(150, 150, 150), anchor="mm")

    if s["photo"]:
        # 촬영본 흉내: 약간 회전 + 그림자 + 노이즈 + 블러 + JPEG
        img = img.rotate(1.5, resample=Image.BICUBIC, expand=True, fillcolor=(235, 235, 235))
        shade = Image.new("L", img.size, 0)
        sd = ImageDraw.Draw(shade)
        for i in range(0, img.size[1], 4):
            sd.line([(0, i), (img.size[0], i)], fill=int(18 * i / img.size[1]))
        img = Image.composite(Image.new("RGB", img.size, (60, 60, 60)), img, shade)
        px = img.load()
        random.seed(7)
        for _ in range(int(img.size[0] * img.size[1] * 0.004)):
            x, y2 = random.randrange(img.size[0]), random.randrange(img.size[1])
            v = random.randrange(150, 230)
            px[x, y2] = (v, v, v)
        img = img.filter(ImageFilter.GaussianBlur(0.6))
    return img


for s in SAMPLES:
    img = render(s)
    path = os.path.join(HERE, s["file"])
    if path.endswith(".jpg"):
        img.convert("RGB").save(path, quality=82)
    else:
        img.save(path)
    print("wrote", s["file"], img.size, s["number"])

const fs = require('fs');
const path = require('path');

const healthArticles = [
  {
    "id": "health-colorectal-cancer-colonoscopy-058",
    "slug": "tam-soat-ung-thu-dai-truc-trang-noi-soi-dinh-ky",
    "title": "Tầm soát ung thư đại trực tràng từ tuổi 45: Nội soi đại tràng và cắt polyp tiền ung thư",
    "description": "Khuyến cáo y khoa của USPSTF và Bộ Y tế về việc nội soi toàn bộ khung đại tràng định kỳ giúp phát hiện và cắt bỏ polyp tuyến trước khi chúng tiến triển thành ung thư ác tính.",
    "category": "health",
    "tags": ["ung thư đại trực tràng", "nội soi đại tràng", "polyp đại tràng", "tầm soát ung thư", "tiêu hóa"],
    "cost": "Vừa phải (khoảng 1.000.000 - 2.500.000 VNĐ cho nội soi gây mê không đau)",
    "reading_time": "6 phút",
    "time": "Nội soi định kỳ mỗi 5-10 năm nếu kết quả hoàn toàn bình thường",
    "effort": "Trung bình (cần uống thuốc làm sạch ruột trước ngày nội soi)",
    "benefits": [
      "Giảm tới 68% tỷ lệ tử vong do ung thư đại trực tràng nhờ cắt bỏ polyp sớm ngay trong lúc nội soi",
      "Phát hiện ung thư từ giai đoạn sớm (giai đoạn I) với tỷ lệ sống sau 5 năm vượt trên 90%",
      "Khoảng cách giữa các lần kiểm tra kéo dài tới 10 năm nếu đại tràng sạch hoàn toàn không có polyp"
    ],
    "risks": [
      "Nguy cơ biến chứng thủng ruột hoặc chảy máu sau cắt polyp là rất thấp (dưới 0,1%) tại các cơ sở y tế uy tín"
    ],
    "target_groups": [
      "Người từ 45 tuổi trở lên, hoặc người có người thân ruột thịt (cha mẹ, anh chị em) từng mắc ung thư đại tràng"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Khuyến cáo cập nhật của Cơ quan Y tế Dự phòng Hoa Kỳ (USPSTF 2021) hạ độ tuổi tầm soát đại trực tràng từ 50 xuống 45 tuổi, và Hướng dẫn chẩn đoán, điều trị ung thư đại trực tràng của Bộ Y tế Việt Nam.",
    "body": "Ung thư đại trực tràng là bệnh ung thư phổ biến thứ 4 tại Việt Nam. Điểm đặc biệt của loại ung thư này là: HƠN 95% CÁC CA BỆNH ĐỀU BẮT ĐẦU TỪ NHỮNG KHỐI POLYP LÀNH TÍNH (Adenomatous Polyps). Quá trình một polyp tuyến nhỏ bé vài milimet đột biến biến thành khối u ung thư xâm lấn thường mất từ 10 ĐẾN 15 NĂM!\nĐiều này có nghĩa là bạn có một 'cửa sổ vàng' kéo dài cả thập kỷ để tìm và tiêu diệt nó trước khi nó kịp gây hại.\n\nTại sao độ tuổi tầm soát được hạ xuống 45 tuổi?\nTrước đây, các hướng dẫn y khoa khuyến cáo tầm soát từ 50 tuổi. Tuy nhiên, dữ liệu dịch tễ học toàn cầu ghi nhận tỷ lệ mắc ung thư đại trực tràng ở người trẻ (30-45 tuổi) tăng vọt do chế độ ăn nhiều thịt đỏ, thức ăn nhanh chế biến sẵn, ít chất xơ và lối sống lười vận động. Do đó, USPSTF và các hiệp hội tiêu hóa quốc tế đã chính thức hạ độ tuổi tầm soát đại trà xuống 45 tuổi.\n\nNội soi đại tràng toàn bộ (Colonoscopy) - Tiêu chuẩn vàng tuyệt đối:\n- Khác với xét nghiệm tìm máu ẩn trong phân (FIT) chỉ có giá trị sàng lọc ban đầu, nội soi đại tràng cho phép bác sĩ dùng camera độ nét cao quan sát trực tiếp toàn bộ lớp niêm mạc đại tràng.\n- ĐẶC BIỆT: Khi phát hiện polyp, bác sĩ sẽ luồn dụng cụ chuyên dụng qua ống nội soi để CẮT BỎ POLYP NGAY LẬP TỨC và gửi làm sinh thiết giải phẫu bệnh mà bệnh nhân không hề đau đớn (nếu chọn nội soi tiền mê). Cắt polyp đồng nghĩa với việc bạn vừa triệt tiêu mầm mống ung thư ngay từ trong trứng nước!\n\nLịch tầm soát khuyến nghị:\n- Người có nguy cơ trung bình (từ 45 tuổi, không có tiền sử gia đình): Bắt đầu nội soi từ tuổi 45. Nếu kết quả bình thường sạch polyp, chỉ cần nội soi lại sau 10 năm.\n- Người có nguy cơ cao (có cha mẹ, anh chị em ruột bị ung thư đại tràng trước 60 tuổi): Phải bắt đầu nội soi tầm soát từ tuổi 40 (hoặc sớm hơn 10 năm so với tuổi của người thân lúc được chẩn đoán mắc bệnh) và lặp lại mỗi 5 năm.",
    "sources": [
      {
        "title": "Screening for Colorectal Cancer: US Preventive Services Task Force Recommendation Statement",
        "organization": "JAMA (Davidson KW, et al.)",
        "url": "https://doi.org/10.1001/jama.2021.6238",
        "country": "Hoa Kỳ",
        "source_type": "Khuyến cáo y tế dự phòng quốc gia USPSTF",
        "published_at": "2021-05-18",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Hướng dẫn chẩn đoán và điều trị ung thư đại trực tràng",
        "organization": "Bộ Y tế Việt Nam (Quyết định số 1514/QĐ-BYT)",
        "url": "https://kcb.vn",
        "country": "Việt Nam",
        "source_type": "Hướng dẫn điều trị chuyên khoa quốc gia",
        "published_at": "2020-04-01",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-helicobacter-pylori-gastric-059",
    "slug": "tiet-tru-vi-khuan-hp-phong-ngua-ung-thu-da-day",
    "title": "Tiệt trừ vi khuẩn Helicobacter pylori (H. pylori): Dự phòng ung thư dạ dày và viêm loét đường tiêu hóa",
    "description": "Đồng thuận Maastricht VI và hướng dẫn của Hội Khoa học Tiêu hóa Việt Nam về chỉ định xét nghiệm test thở C13/C14, phác đồ kháng sinh 4 thuốc và thói quen ăn uống tránh lây nhiễm.",
    "category": "health",
    "tags": ["vi khuẩn hp", "ung thư dạ dày", "viêm loét dạ dày", "h pylori", "tiêu hóa"],
    "cost": "Vừa phải (test thở HP khoảng 400.000 - 700.000 VNĐ; thuốc điều trị theo đơn bảo hiểm)",
    "reading_time": "6 phút",
    "time": "Uống phác đồ kháng sinh liên tục trong 14 ngày chuẩn",
    "effort": "Trung bình (cần tuân thủ uống thuốc đúng giờ, không bỏ liều)",
    "benefits": [
      "Giảm tới 50% nguy cơ tiến triển thành ung thư biểu mô dạ dày ở người có viêm teo niêm mạc",
      "Chữa lành dứt điểm các ổ loét dạ dày - tá tràng mạn tính, chấm dứt đau bụng thượng vị",
      "Cắt đứt nguồn lây nhiễm vi khuẩn HP sang cho con cái và bạn đời trong gia đình"
    ],
    "risks": [
      "Tự ý mua kháng sinh uống ngắt quãng vài ngày sẽ tạo ra chủng vi khuẩn HP kháng thuốc cực kỳ nguy hiểm và khó điều trị"
    ],
    "target_groups": [
      "Người có triệu chứng đau tức thượng vị, ợ hơi, đầy bụng, người có tiền sử gia đình mắc ung thư dạ dày"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Báo cáo Đồng thuận Toàn cầu Maastricht VI / Florence về quản lý nhiễm khuẩn Helicobacter pylori (Gut 2022) và Khuyến cáo chẩn đoán, điều trị H. pylori của Hội Khoa học Tiêu hóa Việt Nam (VNAGE).",
    "body": "Tại Việt Nam, có tới 60% đến 70% dân số mang trong mình vi khuẩn Helicobacter pylori (H. pylori). Tổ chức Y tế Thế giới (IARC/WHO) đã xếp H. pylori vào nhóm TÁC NHÂN GÂY UNG THƯ NHÓM 1 (nhóm chắc chắn gây ung thư cho con người). Đây là thủ phạm chính gây ra hơn 80% các ca ung thư dạ dày tại Việt Nam.\n\nCon đường lây nhiễm vi khuẩn HP trong gia đình Việt:\n- Lây truyền qua đường miệng - miệng: Do thói quen văn hóa ăn uống chung mâm, dùng đũa của mình gắp thức ăn cho người khác, chấm chung một bát nước mắm, mớm cơm cho trẻ nhỏ, hoặc dùng chung cốc nước.\n- Lây qua đường phân - miệng: Do không rửa tay sạch bằng xà phòng sau khi đi vệ sinh hoặc nguồn nước, rau sống bị nhiễm bẩn.\n\nKhi nào cần xét nghiệm và điều trị tiệt trừ HP?\nKhông phải tất cả mọi người có HP đều phải uống thuốc diệt trừ (vì nhiều người chỉ mang khuẩn vô hại). Theo Đồng thuận Maastricht VI và Hội Tiêu hóa Việt Nam, BẮT BUỘC TIỆT TRỪ HP trong các trường hợp sau:\n1. Bị viêm loét dạ dày hoặc loét tá tràng (đang tiến triển hoặc có sẹo cũ).\n2. Người có tiền sử gia đình thế hệ thứ nhất (bố mẹ, anh chị em ruột) mắc ung thư dạ dày.\n3. Kết quả nội soi có tổn thương tiền ung thư: Viêm teo niêm mạc dạ dày nặng (atrophic gastritis) hoặc dị sản ruột (intestinal metaplasia).\n4. Người phải dùng thuốc giảm đau chống viêm NSAIDs hoặc Aspirin kéo dài (để ngừa xuất huyết tiêu hóa).\n\nPhương pháp xét nghiệm chính xác nhất:\n- Test hơi thở (Urea Breath Test C13 hoặc C14): Phương pháp không xâm lấn, độ nhạy và độ đặc hiệu trên 95%. Lưu ý: Phải ngừng thuốc kháng sinh ít nhất 4 tuần và ngừng thuốc ức chế tiết axit (PPI) ít nhất 2 tuần trước khi thổi test hơi thở để tránh kết quả âm tính giả!\n- Tuyệt đối không dùng xét nghiệm máu tìm kháng thể HP để chẩn đoán nhiễm khuẩn đang hoạt động (vì kháng thể trong máu vẫn tồn tại nhiều năm sau khi vi khuẩn đã chết).\n\nNguyên tắc điều trị thành công:\nHiện nay do tỷ lệ vi khuẩn HP kháng Clarithromycin tại Việt Nam rất cao, phác đồ ưu tiên hàng đầu là PHÁC ĐỒ 4 THUỐC CÓ BISMUTH (Bismuth, Metronidazole, Tetracycline và PPI) uống nghiêm ngặt trong 14 ngày. Bắt buộc kiểm tra lại test hơi thở sau khi kết thúc thuốc 4 tuần để xác nhận vi khuẩn đã bị tiêu diệt hoàn toàn.",
    "sources": [
      {
        "title": "Management of Helicobacter pylori infection: the Maastricht VI/Florence consensus report",
        "organization": "Gut (Malfertheiner P, et al.)",
        "url": "https://doi.org/10.1136/gutjnl-2022-327745",
        "country": "Châu Âu / Quốc tế",
        "source_type": "Đồng thuận hướng dẫn lâm sàng tiêu hóa toàn cầu",
        "published_at": "2022-08-08",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Khuyến cáo về chẩn đoán và điều trị nhiễm Helicobacter pylori tại Việt Nam",
        "organization": "Hội Khoa học Tiêu hóa Việt Nam (VNAGE)",
        "url": "http://vnage.org.vn",
        "country": "Việt Nam",
        "source_type": "Hướng dẫn chuyên khoa tiêu hóa quốc gia",
        "published_at": "2022-12-10",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-fatty-liver-masld-lifestyle-060",
    "slug": "dao-nguoc-gan-nhiem-mo-masld-giam-7-phan-tram-can-nang",
    "title": "Đảo ngược Gan nhiễm mỡ liên quan chuyển hóa (MASLD): Chiến lược giảm 7-10% trọng lượng cơ thể",
    "description": "Cập nhật thuật ngữ mới MASLD (thay thế NAFLD) của các hiệp hội gan mật quốc tế và bằng chứng về việc giảm 7-10% cân nặng giúp thoái triển hoàn toàn mỡ trong tế bào gan và ngăn xơ gan.",
    "category": "health",
    "tags": ["gan nhiễm mỡ", "masld", "nafld", "giảm cân", "xơ gan"],
    "cost": "Miễn phí (chế độ dinh dưỡng và tập thể thao)",
    "reading_time": "6 phút",
    "time": "Lộ trình giảm cân bền vững trong 3-6 tháng",
    "effort": "Trung bình",
    "benefits": [
      "Loại bỏ hoàn toàn tình trạng lắng đọng chất béo triglyceride trong nhu mô gan",
      "Giảm viêm gan nhiễm mỡ (MASH), ngăn chặn tiến triển thành xơ gan và ung thư biểu mô tế bào gan",
      "Cải thiện độ nhạy insulin, hạ mỡ máu và huyết áp"
    ],
    "risks": [
      "Giảm cân quá nhanh (quá 1,5 kg/tuần) qua nhịn đói cực đoan có thể làm tăng lượng axit béo tự do tràn vào gan khiến viêm gan nặng hơn"
    ],
    "target_groups": [
      "Người được chẩn đoán gan nhiễm mỡ độ 1, 2, 3 qua siêu âm, người thừa cân, béo bụng hoặc tiền đái tháo đường"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Hướng dẫn thực hành lâm sàng đa hội của Hiệp hội Nghiên cứu Bệnh Gan Hoa Kỳ (AASLD 2023) và Hiệp hội Gan mật Châu Âu (EASL 2024) về bệnh gan nhiễm mỡ liên quan rối loạn chuyển hóa (MASLD).",
    "body": "Nhiều người đi khám sức khỏe định kỳ nhận kết quả 'Gan nhiễm mỡ độ 1 hoặc độ 2' thường bỏ qua vì thấy mình không đau đớn, vẫn ăn ngon ngủ tốt. Đây là một sai lầm vô cùng tai hại! Gan nhiễm mỡ không được can thiệp sớm sẽ âm thầm tiến triển thành Viêm gan thoái hóa mỡ (MASH), dẫn thẳng đến XƠ GAN và UNG THƯ GAN mà không cần phải uống một giọt rượu bia nào!\n\nĐổi tên từ NAFLD sang MASLD (Đồng thuận Quốc tế 2023):\nCác hiệp hội gan mật hàng đầu thế giới đã thống nhất đổi tên 'Bệnh gan nhiễm mỡ không do rượu' (NAFLD) thành 'Bệnh gan nhiễm mỡ liên quan rối loạn chức năng chuyển hóa' (Metabolic Dysfunction-Associated Steatotic Liver Disease - MASLD). Tên gọi mới khẳng định: Bệnh gan nhiễm mỡ thực chất là một biểu hiện của HỘI CHỨNG CHUYỂN HÓA (thừa cân béo bụng, kháng insulin, rối loạn lipid máu, tăng huyết áp).\n\nCon số vàng: GIẢM 7% ĐẾN 10% TRỌNG LƯỢNG CƠ THỂ:\nCho đến nay, KHÔNG CÓ BẤT KỲ VIÊN THUỐC THẦN KỲ NÀO ĐƯỢC CẤP PHÉP ĐỂ ĐẶC TRỊ KHỎI HOÀN TOÀN GAN NHIỄM MỠ! Liều thuốc duy nhất có bằng chứng lâm sàng vững chắc nhất chính là GIẢM CÂN CÓ KIỂM SOÁT:\n- Giảm 3% - 5% trọng lượng cơ thể: Làm thoái triển hoàn toàn lượng mỡ tích tụ trong tế bào gan (giảm độ gan nhiễm mỡ từ độ 2 xuống độ 1 hoặc bình thường).\n- Giảm 7% - 10% trọng lượng cơ thể: Chấm dứt hoàn toàn tình trạng viêm hoại tử tế bào gan và thậm chí LÀM ĐẢO NGƯỢC CẢ QUÁ TRÌNH XƠ HÓA GAN GIAI ĐOẠN SỚM!\n\nChiến lược hành động '3 cắt giảm - 2 gia tăng':\n1. CẮT GIẢM SỐ 1: ĐƯỜNG FRUCTOSE: Nước ngọt có ga, trà sữa, nước ép trái cây đóng hộp. Fructose là loại đường duy nhất chỉ được chuyển hóa tại gan, trực tiếp kích hoạt quá trình tân tạo mỡ (De Novo Lipogenesis) biến thành mỡ gan nhanh nhất.\n2. Cắt giảm đồ chiên xào nhiều dầu mỡ, mỡ động vật và phủ tạng.\n3. Cắt giảm bia rượu hoàn toàn.\n4. GIA TĂNG TẬP THỂ DỤC: Tối thiểu 150 phút mỗi tuần (đi bộ nhanh, chạy bộ, bơi lội, đạp xe hoặc tập kháng lực). Vận động cơ bắp giúp đốt cháy mỡ gan ngay cả khi cân nặng chưa giảm nhiều.\n5. Uống cà phê nguyên chất: Tiêu thụ 2-3 tách cà phê đen không đường mỗi ngày được chứng minh giúp bảo vệ gan và giảm nguy cơ xơ hóa gan nhờ các hợp chất polyphenol chống oxy hóa.",
    "sources": [
      {
        "title": "A multi-society Delphi consensus statement on new fatty liver disease nomenclature",
        "organization": "Journal of Hepatology / AASLD / EASL (Rinella ME, et al.)",
        "url": "https://doi.org/10.1016/j.jhep.2023.06.003",
        "country": "Hoa Kỳ / Châu Âu",
        "source_type": "Đồng thuận quốc tế về danh pháp bệnh gan mật",
        "published_at": "2023-12-01",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "EASL-EASD-EASO Clinical Practice Guidelines on the management of metabolic dysfunction-associated steatotic liver disease (MASLD)",
        "organization": "Journal of Hepatology (EASL)",
        "url": "https://doi.org/10.1016/j.jhep.2024.04.031",
        "country": "Châu Âu",
        "source_type": "Hướng dẫn thực hành lâm sàng gan mật châu Âu",
        "published_at": "2024-06-01",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-prediabetes-lifestyle-intervention-061",
    "slug": "can-thiep-tien-dai-thao-duong-nghien-cuu-dpp-giam-58-phan-tram",
    "title": "Can thiệp Tiền đái tháo đường: Nghiên cứu DPP chứng minh giảm 58% nguy cơ mắc tiểu đường tuýp 2",
    "description": "Tiêu chuẩn chẩn đoán tiền đái tháo đường qua HbA1c (5,7 - 6,4%) và kết quả thử nghiệm lâm sàng DPP trên NEJM chứng minh thay đổi lối sống hiệu quả gấp đôi việc dùng thuốc Metformin.",
    "category": "health",
    "tags": ["tiền đái tháo đường", "hba1c", "tiểu đường tuýp 2", "nghiên cứu dpp", "bộ y tế"],
    "cost": "Miễn phí (chế độ ăn và tập luyện) hoặc xét nghiệm HbA1c khoảng 100.000 VNĐ",
    "reading_time": "6 phút",
    "time": "Duy trì can thiệp lối sống liên tục trong suốt cuộc đời",
    "effort": "Trung bình",
    "benefits": [
      "Ngăn chặn hoàn toàn việc phải uống thuốc hạ đường huyết hoặc tiêm insulin suốt đời",
      "Bảo vệ hệ thống vi mạch máu mắt, thận và dây thần kinh khỏi bị tổn thương đường huyết",
      "Hạ huyết áp và cải thiện các chỉ số mỡ máu triglyceride tự nhiên"
    ],
    "risks": [
      "Nếu không can thiệp, khoảng 70% người tiền tiểu đường sẽ tiến triển thành Đái tháo đường tuýp 2 thực sự trong vòng 5-10 năm"
    ],
    "target_groups": [
      "Người có chỉ số HbA1c từ 5,7% đến 6,4%, người có vòng bụng lớn (>90cm ở nam, >80cm ở nữ), người có tiền sử gia đình tiểu đường"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Thử nghiệm lâm sàng đa trung tâm quy mô lớn DPP (Diabetes Prevention Program Research Group công bố trên NEJM 2002) theo dõi dài hạn 15 năm và Quyết định số 3280/QĐ-BYT của Bộ Y tế về Hướng dẫn chẩn đoán và điều trị tiền đái tháo đường.",
    "body": "Nhiều người đi xét nghiệm máu thấy chỉ số đường huyết lúc đói hơi cao nhẹ hoặc chỉ số HbA1c nằm ở mức 6,0% thường được bác sĩ thông báo: 'Bị tiền đái tháo đường rồi nhé'. Đa số nghĩ rằng 'chưa phải tiểu đường thật thì chưa lo'. Đây là một hiểu lầm chết người! Ở giai đoạn tiền tiểu đường, các biến chứng vi mạch máu ở mắt, thận và tim mạch ĐÃ BẮT ĐẦU ÂM THẦM BỊ BÀO MÒN!\n\nTiêu chuẩn chẩn đoán Tiền đái tháo đường theo Bộ Y tế:\nChỉ cần thỏa mãn 1 trong 3 tiêu chuẩn xét nghiệm sau:\n1. Đường huyết lúc đói (FPG): Từ 5,6 đến 6,9 mmol/L (100 - 125 mg/dL).\n2. Nghiệm pháp dung nạp glucose đường uống sau 2 giờ (OGTT 75g): Từ 7,8 đến 11,0 mmol/L (140 - 199 mg/dL).\n3. Chỉ số HbA1c (phản ánh đường huyết trung bình trong 3 tháng): Từ 5,7% đến 6,4%.\n\nKhám phá lịch sử của Nghiên cứu DPP (NEJM 2002):\nNghiên cứu can thiệp phòng ngừa đái tháo đường DPP trên hơn 3.200 người tiền tiểu đường đã so sánh 3 nhóm:\n- Nhóm 1: Dùng giả dược (Placebo).\n- Nhóm 2: Uống thuốc Metformin 850 mg x 2 lần/ngày.\n- Nhóm 3: THAY ĐỔI LỐI SỐNG TÍCH CỰC (giảm 7% cân nặng và tập thể dục 150 phút/tuần).\nKẾT QUẢ ĐỘT PHÁ:\n- Nhóm uống thuốc Metformin: Giảm được 31% nguy cơ tiến triển thành tiểu đường.\n- NHÓM THAY ĐỔI LỐI SỐNG: GIẢM TỚI 58% NGUY CƠ TIẾN TRIỂN THÀNH TIỂU ĐƯỜNG (ở người trên 60 tuổi, tỷ lệ giảm lên tới 71%!).\nThay đổi lối sống có hiệu quả phòng ngừa cao GẤP ĐÔI so với việc dùng thuốc tây!\n\nCông thức đảo ngược Tiền tiểu đường tại nhà:\n1. Ăn theo quy tắc 'Đĩa thức ăn lành mạnh': 1/2 đĩa là rau củ luộc/hấp nhiều chất xơ; 1/4 đĩa là protein nạc (ức gà, cá, đậu phụ, trứng); 1/4 đĩa còn lại là tinh bột phức hợp (gạo lứt, yến mạch, khoai lang).\n2. Đi bộ 15-20 phút NGAY SAU BỮA ĂN: Khi cơ bắp đùi co bóp sau bữa ăn, thụ thể GLUT4 trên màng tế bào cơ tự động mở ra để hút glucose trong máu vào nuôi cơ BẰNG CƠ CHẾ ĐỘC LẬP KHÔNG CẦN INSULIN! Nhờ đó đường huyết sau ăn không bị tăng vọt.",
    "sources": [
      {
        "title": "Reduction in the Incidence of Type 2 Diabetes with Lifestyle Intervention or Metformin",
        "organization": "The New England Journal of Medicine (DPP Research Group)",
        "url": "https://doi.org/10.1056/NEJMoa012512",
        "country": "Hoa Kỳ",
        "source_type": "Thử nghiệm lâm sàng ngẫu nhiên có đối chứng kinh điển NEJM",
        "published_at": "2002-02-07",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Hướng dẫn chẩn đoán và điều trị tiền đái tháo đường",
        "organization": "Bộ Y tế Việt Nam (Quyết định số 3280/QĐ-BYT)",
        "url": "https://kcb.vn",
        "country": "Việt Nam",
        "source_type": "Hướng dẫn chẩn đoán và điều trị y tế quốc gia",
        "published_at": "2020-07-09",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-pneumococcal-vaccine-adults-062",
    "slug": "tiem-phong-phe-cau-nguoi-lon-phong-viem-phoi-viem-mang-nao",
    "title": "Tiêm vắc xin phế cầu khuẩn ở người lớn: Dự phòng viêm phổi nặng và nhiễm khuẩn huyết",
    "description": "Khuyến cáo của CDC Hoa Kỳ và Bộ Y tế về việc tiêm vắc xin phế cầu liên hợp (PCV13/PCV15/PCV20) cho người từ 65 tuổi hoặc người có bệnh nền mạn tính giúp giảm 75% bệnh phế cầu xâm lấn.",
    "category": "health",
    "tags": ["vắc xin phế cầu", "viêm phổi người lớn", "prevenar 13", "tiêm chủng người lớn", "bệnh mạn tính"],
    "cost": "Vừa phải (khoảng 1.200.000 - 1.500.000 VNĐ cho một mũi vắc xin có hiệu lực lâu năm)",
    "reading_time": "5 phút",
    "time": "Tiêm 1-2 mũi theo phác đồ khuyến nghị tại các trung tâm tiêm chủng",
    "effort": "Rất thấp",
    "benefits": [
      "Giảm tới 75% nguy cơ mắc các bệnh phế cầu xâm lấn (viêm màng não mủ, nhiễm trùng huyết)",
      "Giảm tỷ lệ nhập viện hồi sức thở máy và tử vong do viêm phổi thùy ở người cao tuổi",
      "Bảo vệ người mắc bệnh phổi tắc nghẽn mạn tính (COPD) và hen suyễn khỏi các đợt cấp tính nguy kịch"
    ],
    "risks": [
      "Phản ứng phụ nhẹ thoáng qua sau tiêm: sưng đỏ đau tại vị trí tiêm bắp tay, sốt nhẹ hoặc đau cơ trong 24-48 giờ"
    ],
    "target_groups": [
      "Người từ 65 tuổi trở lên, người lớn từ 19-64 tuổi có bệnh nền (COPD, hen suyễn, tiểu đường, suy thận, tim mạch)"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Khuyến cáo tiêm chủng của Ủy ban Cố vấn Thực hành Tiêm chủng Hoa Kỳ (ACIP/CDC 2023) và Hướng dẫn tiêm chủng người lớn của Hội Y học Dự phòng Việt Nam.",
    "body": "Đa số người dân Việt Nam nghĩ rằng tiêm vắc xin chỉ dành cho trẻ em. Thực tế, phế cầu khuẩn (Streptococcus pneumoniae) là 'sát thủ hàng đầu' gây tử vong ở người lớn tuổi: Viêm phổi do phế cầu ở người già trên 65 tuổi có tỷ lệ tử vong lên tới 20-30%, và tỷ lệ này tăng vọt lên 50% nếu vi khuẩn tràn vào máu gây nhiễm trùng huyết!\nHiện nay, tình trạng phế cầu khuẩn kháng thuốc kháng sinh (đặc biệt kháng penicillin và macrolide) tại Việt Nam đang ở mức báo động đỏ (>80%), khiến việc điều trị bằng thuốc kháng sinh trở nên cực kỳ khó khăn và tốn kém hàng chục triệu đồng tiền viện phí.\n\nTại sao người lớn tuổi bắt buộc phải tiêm phế cầu?\nKhi tuổi tác tăng lên, hệ thống miễn dịch trải qua quá trình 'lão hóa miễn dịch' (Immunosenescence), khả năng tự sản sinh kháng thể chống vi khuẩn vỏ nang phế cầu suy giảm trầm trọng. Các lông chuyển đường thở bị tê liệt khiến vi khuẩn dễ dàng lọt sâu vào phế nang phổi.\n\nPhác đồ tiêm phòng phế cầu khuẩn chuẩn y khoa:\n1. Đối tượng bắt buộc tiêm:\n- Tất cả người lớn từ 65 tuổi trở lên (dù hoàn toàn khỏe mạnh).\n- Người từ 19 đến 64 tuổi có bệnh lý nền: Đái tháo đường, bệnh phổi tắc nghẽn mạn tính (COPD), hen phế quản, suy tim, bệnh thận mạn, xơ gan, người nghiện thuốc lá hoặc suy giảm miễn dịch.\n2. Các loại vắc xin hiện có tại Việt Nam:\n- Vắc xin phế cầu liên hợp 13 giá (PCV13 - Prevenar 13): Tạo đáp ứng miễn dịch tế bào T mạnh mẽ, có trí nhớ miễn dịch lâu dài. Người lớn chỉ cần TIÊM 01 MŨI DUY NHẤT trong đời.\n- Vắc xin phế cầu polysaccharide 23 giá (PPSV23 - Pneumovax 23): Bao phủ thêm 23 chủng huyết thanh, thường được tiêm nhắc sau mũi liên hợp 1 năm đối với nhóm nguy cơ cao.\nChỉ một mũi tiêm duy nhất ở bắp tay có giá khoảng hơn 1 triệu đồng có thể bảo vệ lá phổi của cha mẹ bạn an toàn suốt nhiều năm tuổi già.",
    "sources": [
      {
        "title": "Use of 15-Valent Pneumococcal Conjugate Vaccine and 20-Valent Pneumococcal Conjugate Vaccine Among U.S. Adults: Updated Recommendations of the ACIP",
        "organization": "MMWR / CDC (Kobayashi M, et al.)",
        "url": "https://www.cdc.gov/mmwr/volumes/71/wr/mm7104a1.htm",
        "country": "Hoa Kỳ",
        "source_type": "Khuyến cáo tiêm chủng chính thức ACIP/CDC",
        "published_at": "2022-01-28",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Khuyến cáo về tiêm chủng vắc xin phòng bệnh phế cầu ở người lớn và nhóm người có bệnh mạn tính",
        "organization": "Hội Y học Dự phòng Việt Nam",
        "url": "https://ypdp.vn",
        "country": "Việt Nam",
        "source_type": "Khuyến cáo chuyên khoa y học dự phòng quốc gia",
        "published_at": "2023-04-10",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-shingles-herpes-zoster-vaccine-063",
    "slug": "tiem-phong-zona-than-kinh-shingrix-ngua-dau-day-than-kinh",
    "title": "Tiêm phòng vắc xin Zona thần kinh (Shingrix): Chặn đứng cơn ác mộng đau thần kinh sau zona",
    "description": "Cơ chế tái hoạt của virus Varicella-Zoster ngủ yên trong hạch thần kinh và hiệu quả bảo vệ trên 90% của vắc xin tái tổ hợp Shingrix ở người trên 50 tuổi.",
    "category": "health",
    "tags": ["zona thần kinh", "vắc xin shingrix", "đau sau zona", "herpes zoster", "người lớn tuổi"],
    "cost": "Cao (khoảng 3.800.000 VNĐ/mũi, phác đồ 2 mũi)",
    "reading_time": "5 phút",
    "time": "Tiêm 2 mũi cách nhau từ 2 đến 6 tháng",
    "effort": "Rất thấp",
    "benefits": [
      "Ngăn ngừa hơn 90% nguy cơ bùng phát bệnh zona thần kinh ở người trên 50 tuổi",
      "Phòng tránh biến chứng Đau dây thần kinh sau zona (PHN) — cơn đau buốt như dao cắt kéo dài hàng năm trời",
      "Phòng ngừa nguy cơ biến chứng zona mắt gây loét giác mạc và mù lòa"
    ],
    "risks": [
      "Tác dụng phụ sau tiêm: Đau nhức cơ bắp, mệt mỏi hoặc sốt nhẹ trong 1-2 ngày do đáp ứng tạo kháng thể mạnh mẽ của vắc xin"
    ],
    "target_groups": [
      "Người từ 50 tuổi trở lên, người từ 18 tuổi có tình trạng suy giảm miễn dịch (từng mắc thủy đậu lúc nhỏ)"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên các thử nghiệm lâm sàng ngẫu nhiên pha III quy mô lớn ZOE-50 và ZOE-70 công bố trên New England Journal of Medicine (NEJM 2015, 2016) chứng minh vắc xin tái tổ hợp Shingrix đạt hiệu quả bảo vệ 97% ở người 50 tuổi và 91% ở người trên 70 tuổi.",
    "body": "Bất kỳ ai từng bị bệnh Thủy đậu lúc nhỏ đều đang mang trong cơ thể một 'quả bom nổ chậm': Virus Varicella-Zoster (VZV) không bao giờ biến mất hoàn toàn. Sau khi khỏi thủy đậu, virus rút lui về ngủ đông vĩnh viễn trong các hạch rễ sau của dây thần kinh tủy sống. Khi bước qua tuổi 50, hệ miễn dịch suy yếu, virus thức giấc, nhân lên ồ ạt và di chuyển dọc theo dây thần kinh ra da, bùng phát thành bệnh ZONA THẦN KINH (Giời leo).\n\nCơn ác mộng 'Đau dây thần kinh sau zona' (Postherpetic Neuralgia - PHN):\nPhát ban mụn nước của zona chỉ kéo dài 2-3 tuần rồi lành sẹo. Nhưng điều kinh hoàng nhất là biến chứng ĐAU SAU ZONA: Virus phá hủy hoàn toàn lớp myelin của sợi thần kinh cảm giác. Ngay cả khi da đã lành lặn, bệnh nhân vẫn phải chịu đựng những cơn đau buốt kinh hoàng: cảm giác như bị dao đâm, kim châm, hoặc bỏng ớt liên tục 24/24 giờ. Thậm chí chỉ một cơn gió nhẹ thoảng qua hay vạt áo mỏng cọ vào da cũng gây đau đớn đến phát khóc!\nNhiều người cao tuổi bị đau sau zona kéo dài suốt 5-10 năm, dẫn đến mất ngủ triền miên, suy kiệt và trầm cảm nặng có ý định tự sát.\n\nVắc xin Shingrix - Bước tiến y học vĩ đại:\n- Vắc xin Shingrix (vắc xin tái tổ hợp bất hoạt có tá dược AS01B) đã chính thức được Bộ Y tế Việt Nam cấp phép lưu hành.\n- Khác với vắc xin sống giảm độc lực cũ trước đây (hiệu quả thấp và suy giảm nhanh), Shingrix đạt hiệu quả bảo vệ lên tới 97% ở người từ 50-69 tuổi và trên 91% ở người trên 70 tuổi, duy trì khả năng bảo vệ vững chắc suốt hơn 10 năm.\n- Phác đồ tiêm: Gồm 2 mũi tiêm bắp, mũi 2 cách mũi 1 từ 2 đến 6 tháng. Đây là món quà sức khỏe vô giá và thiết thực nhất mà con cái có thể dành tặng cho cha mẹ bước vào độ tuổi ngũ tuần.",
    "sources": [
      {
        "title": "Efficacy of an adjuvanted herpes zoster subunit vaccine in older adults",
        "organization": "The New England Journal of Medicine (Lal H, et al. - ZOE-50 Study Group)",
        "url": "https://doi.org/10.1056/NEJMoa1501184",
        "country": "Hoa Kỳ / Quốc tế",
        "source_type": "Thử nghiệm lâm sàng ngẫu nhiên mù đôi đa trung tâm NEJM",
        "published_at": "2015-04-28",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Recommendations of the Advisory Committee on Immunization Practices for Use of Herpes Zoster Vaccines",
        "organization": "MMWR / CDC (Dooling KL, et al.)",
        "url": "https://www.cdc.gov/mmwr/volumes/67/wr/mm6703a5.htm",
        "country": "Hoa Kỳ",
        "source_type": "Hướng dẫn tiêm chủng chính thức ACIP/CDC",
        "published_at": "2018-01-26",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-dry-eye-syndrome-screen-rule-064",
    "slug": "phong-ngua-kho-mat-do-may-tinh-quy-tac-20-20-20",
    "title": "Phòng ngừa Hội chứng Khô mắt do dùng màn hình máy tính: Quy tắc 20-20-20 và nước mắt nhân tạo",
    "description": "Khoa học về sự sụt giảm 60% tần số chớp mắt khi nhìn màn hình kỹ thuật số và các biện pháp bảo tồn màng phim nước mắt chuẩn nhãn khoa.",
    "category": "health",
    "tags": ["khô mắt", "quy tắc 20 20 20", "nước mắt nhân tạo", "nhãn khoa", "sức khỏe dân văn phòng"],
    "cost": "Rất thấp (nước mắt nhân tạo tép không chất bảo quản khoảng 150.000 - 300.000 VNĐ/hộp)",
    "reading_time": "5 phút",
    "time": "Thực hiện ngắt quãng nghỉ mắt sau mỗi 20 phút làm việc",
    "effort": "Rất thấp",
    "benefits": [
      "Chấm dứt cảm giác cay rát, xốn cộm như có hạt cát trong mắt và đỏ mắt vào cuối ngày",
      "Ngăn ngừa tổn thương trợt biểu mô giác mạc và suy giảm thị lực do khô mắt mạn tính",
      "Giảm đau đầu và mệt mỏi điều tiết cơ thể mi"
    ],
    "risks": [
      "Lạm dụng các loại thuốc nhỏ mắt chứa chất co mạch (chống đỏ mắt cấp tốc) kéo dài có thể gây nghiện thuốc và khô mắt nặng hơn"
    ],
    "target_groups": [
      "Nhân viên văn phòng, lập trình viên, học sinh sinh viên học tập trên máy tính, điện thoại trên 4 tiếng/ngày"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Hướng dẫn lâm sàng của Hiệp hội Màng phim Nước mắt và Bề mặt Nhãn cầu Quốc tế (TFOS DEWS II Report) và khuyến cáo của Hiệp hội Nhãn khoa Hoa Kỳ (AAO).",
    "body": "Trong trạng thái sinh hoạt tự nhiên, mắt người chớp trung bình từ 15 ĐẾN 20 LẦN MỖI PHÚT. Mỗi lần chớp mắt, mi mắt hoạt động như một chiếc cần gạt nước ô tô, dàn đều một lớp màng phim nước mắt (Tear Film) mỏng manh lên bề mặt giác mạc để giữ ẩm và bảo vệ mắt khỏi vi khuẩn.\nTuy nhiên, các nghiên cứu nhãn khoa ghi nhận: KHI DÁN MẮT VÀO MÀN HÌNH MÁY TÍNH HOẶC ĐIỆN THOẠI, TẦN SỐ CHỚP MẮT TỰ NHIÊN BỊ TỤT GIẢM TỚI 60% (chỉ còn 5-7 lần/phút)! Hơn nữa, đa số các lần chớp mắt khi nhìn màn hình chỉ là 'chớp mắt không hoàn toàn' (mi trên chưa kịp chạm mi dưới đã mở ra). Hệ quả: Màng phim nước mắt bị bốc hơi cạn kiệt, để lộ bề mặt giác mạc trần trụi cọ sát gây tổn thương viêm loét vi thể.\n\n3 giải pháp nhãn khoa chuẩn mực bảo vệ mắt:\n\n1. Quy tắc 20 - 20 - 20 kinh điển của Hiệp hội Nhãn khoa Hoa Kỳ (AAO):\n- Cứ sau mỗi 20 PHÚT nhìn màn hình:\n- Hãy hướng mắt nhìn ra một vật thể ở khoảng cách 20 FEET (khoảng 6 MÉT, tương đương nhìn qua cửa sổ ra tán cây xa).\n- Duy trì nhìn xa trong đúng 20 GIÂY.\n- Hành động nhìn xa này giúp cơ thể mi (Ciliary Muscle) trong mắt được thả lỏng hoàn toàn khỏi trạng thái co quắp điều tiết cự ly gần.\n\n2. Bài tập 'Chớp mắt có ý thức':\n- Cố tình chớp mắt chậm rãi: Nhắm mắt hoàn toàn trong 2 giây, sau đó mở mắt ra. Lặp lại 5 lần để kích thích tuyến Meibomius ở bờ mi tiết lớp dầu lipid ngăn bốc hơi nước mắt.\n\n3. Lựa chọn đúng Nước mắt nhân tạo (Artificial Tears):\n- ƯU TIÊN LOẠI TÉP ĐƠN KHÔNG CHẤT BẢO QUẢN (Preservative-free như Sodium Hyaluronate 0.1% - 0.18%): Dạng tép nhỏ bẻ nắp dùng trong ngày, hoàn toàn không chứa Benzalkonium Chloride (chất bảo quản gây độc cho biểu mô giác mạc nếu dùng nhiều lần).\n- TUYỆT ĐỐI TRÁNH XA các loại thuốc nhỏ mắt quảng cáo 'làm trắng mắt, hết đỏ tức thì': Chúng chứa hoạt chất co mạch (Naphazoline, Tetrahydrozoline) chỉ có tác dụng ép mạch máu co lại tạm thời, khi hết thuốc sẽ gây phản ứng giãn mạch dội ngược (Rebound Redness) khiến mắt càng đỏ và khô rát nặng hơn!",
    "sources": [
      {
        "title": "TFOS DEWS II Management and Therapy Report",
        "organization": "The Ocular Surface / TFOS (Jones L, et al.)",
        "url": "https://doi.org/10.1016/j.jtos.2017.05.006",
        "country": "Hoa Kỳ / Quốc tế",
        "source_type": "Báo cáo đồng thuận nhãn khoa quốc tế TFOS DEWS II",
        "published_at": "2017-07-01",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Computers, Digital Devices and Eye Strain",
        "organization": "American Academy of Ophthalmology (AAO)",
        "url": "https://www.aao.org/eye-health/tips-prevention/computer-usage",
        "country": "Hoa Kỳ",
        "source_type": "Hướng dẫn y tế dự phòng nhãn khoa chính thức",
        "published_at": "2023-03-10",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-sleep-apnea-cpap-screening-065",
    "slug": "hoi-chung-ngung-tho-khi-ngu-osa-ngay-to-nguy-co-dot-quy",
    "title": "Hội chứng Ngưng thở khi ngủ do tắc nghẽn (OSA): Ngáy to và hiểm họa đột quỵ âm thầm",
    "description": "Bảng câu hỏi sàng lọc STOP-BANG, cơ chế tụt oxy máu về đêm do xẹp đường thở và giải pháp điều trị tiêu chuẩn vàng bằng máy thở áp lực dương liên tục (CPAP).",
    "category": "health",
    "tags": ["ngưng thở khi ngủ", "osa", "ngáy to", "máy thở cpap", "đột quỵ não"],
    "cost": "Đo đa ký giấc ngủ khoảng 1.500.000 - 3.000.000 VNĐ tại bệnh viện",
    "reading_time": "6 phút",
    "time": "Chẩn đoán qua đo đa ký giấc ngủ 1 đêm tại phòng lab",
    "effort": "Thấp",
    "benefits": [
      "Hạ huyết áp kháng trị và giảm 50% nguy cơ nhồi máu cơ tim, đột quỵ não tái phát",
      "Khôi phục giấc ngủ sâu chất lượng cao, chấm dứt cơn buồn ngủ gật gù nguy hiểm khi đang lái xe",
      "Cải thiện chức năng sinh lý và độ tập trung minh mẫn ban ngày"
    ],
    "risks": [
      "Người bị ngưng thở khi ngủ nặng nếu uống thuốc ngủ liều cao có thể làm ức chế cơ hô hấp dẫn đến ngừng thở tử vong trong đêm"
    ],
    "target_groups": [
      "Nam giới trung niên béo bụng, cổ ngắn to, người ngáy to kèm cơn nghẹt thở giật mình thức giấc, người ngủ đủ giấc nhưng sáng dậy vẫn mệt mỏi"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Hướng dẫn thực hành lâm sàng của Viện Hàn lâm Y học Giấc ngủ Hoa Kỳ (AASM 2017) và Hội Y học Giấc ngủ Việt Nam (VSSM) về chẩn đoán và quản lý hội chứng ngưng thở khi ngủ do tắc nghẽn ở người lớn.",
    "body": "Nhiều người Việt Nam vẫn coi 'ngáy to' là biểu hiện của một người ngủ say, ngon giấc. Dưới góc độ y học giấc ngủ, ĐÂY LÀ MỘT QUAN NIỆM SAI LẦM TAI HẠI! Tiếng ngáy to ngắt quãng kèm theo những khoảng lặng im phăng phắc rồi giật mình thở hổn hển chính là dấu hiệu của HỘI CHỨNG NGƯNG THỞ KHI NGỦ DO TẮC NGHẼN (Obstructive Sleep Apnea - OSA).\n\nCơ chế sinh lý bệnh của OSA:\nKhi bạn chìm vào giấc ngủ sâu, các khối cơ vùng hầu họng (lưỡi gà, màn hầu, đáy lưỡi) bị giãn mềm. Ở những người thừa cân béo phì, cổ ngắn to hoặc có bất thường giải phẫu hàm mặt, các khối mô mềm này sụp xuống bít kín hoàn toàn khí quản:\n- Không khí không thể lọt vào phổi. Bệnh nhân ngừng thở từ 10 giây đến hơn 1 phút!\n- Nồng độ oxy trong máu tụt dốc thê thảm (SpO2 có thể tụt từ 98% xuống dưới 70%).\n- Não bộ nhận thấy nguy cơ chết ngạt lập tức phát tín hiệu báo động khẩn cấp: giải phóng một đợt sóng Adrenaline ồ ạt, làm co thắt mạch máu, huyết áp tăng vọt lên 180-200 mmHg và ép tim đập loạn xạ để đánh thức cơ thể giật mình dậy mở đường thở.\nHiện tượng ngạt thở - giật mình này lặp đi lặp lại từ vài chục đến HÀNG TRĂM LẦN MỖI ĐÊM! Bệnh nhân không hề có lấy một phút ngủ sâu, sáng dậy mệt mỏi rã rời, đau đầu, ngủ gật nguy hiểm khi lái xe và đối mặt với nguy cơ đột quỵ cao gấp 3-4 lần bình thường.\n\nBộ câu hỏi tự sàng lọc STOP-BANG (Chỉ cần có từ 3 điểm trở lên là nguy cơ cao):\n- S (Snoring): Bạn có ngáy to (nghe thấy qua cửa phòng đóng kín)?\n- T (Tired): Bạn có thường xuyên mệt mỏi, buồn ngủ ban ngày?\n- O (Observed): Đã có ai nhìn thấy bạn ngừng thở trong lúc ngủ chưa?\n- P (Pressure): Bạn có bị tăng huyết áp không?\n- B (BMI): Chỉ số BMI có trên 30 kg/m²?\n- A (Age): Bạn trên 50 tuổi?\n- N (Neck): Chu vi vòng cổ có trên 40 cm (ở nam) hoặc 38 cm (ở nữ)?\n- G (Gender): Giới tính nam?\n\nTiêu chuẩn vàng chẩn đoán và điều trị:\n- Chẩn đoán: Đo đa ký giấc ngủ (Polysomnography) qua đêm tại bệnh viện để đếm chính xác chỉ số ngưng - giảm thở (AHI).\n- Điều trị tiêu chuẩn vàng: Đeo MÁY THỞ ÁP LỰC DƯƠNG LIÊN TỤC (CPAP) khi ngủ. Chiếc máy sẽ thổi một luồng khí nén nhẹ nhàng qua mặt nạ mũi, đóng vai trò như một chiếc 'nẹp khí' giữ cho đường thở luôn mở toang suốt đêm. 100% bệnh nhân dùng CPAP đều cảm nhận sự hồi sinh kỳ diệu: huyết áp hạ về bình thường, hết ngáy và tỉnh táo minh mẫn hoàn toàn.",
    "sources": [
      {
        "title": "Clinical Practice Guideline for Diagnostic Testing for Adult Obstructive Sleep Apnea",
        "organization": "Journal of Clinical Sleep Medicine / AASM (Kapur VK, et al.)",
        "url": "https://doi.org/10.5664/jcsm.6506",
        "country": "Hoa Kỳ",
        "source_type": "Hướng dẫn thực hành lâm sàng y học giấc ngủ AASM",
        "published_at": "2017-03-15",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Tài liệu hướng dẫn chẩn đoán và điều trị hội chứng ngừng thở khi ngủ do tắc nghẽn",
        "organization": "Hội Y học Giấc ngủ Việt Nam (VSSM)",
        "url": "http://vssm.vn",
        "country": "Việt Nam",
        "source_type": "Tài liệu chuyên môn y học giấc ngủ quốc gia",
        "published_at": "2021-11-20",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-vitamin-b12-deficiency-metformin-066",
    "slug": "thieu-hut-vitamin-b12-o-nguoi-an-chay-va-dung-metformin",
    "title": "Tầm soát thiếu hụt Vitamin B12: Cảnh báo cho người ăn chay trường và bệnh nhân tiểu đường dùng Metformin",
    "description": "Cơ chế giảm hấp thu vitamin B12 tại hồi tràng do thuốc Metformin và chế độ ăn thuần thực vật, các biểu hiện thần kinh ngoại biên dễ bị chẩn đoán nhầm và xét nghiệm nồng độ B12 định kỳ.",
    "category": "health",
    "tags": ["vitamin b12", "metformin", "ăn chay trường", "thiếu máu ác tính", "thần kinh ngoại biên"],
    "cost": "Thấp (xét nghiệm máu B12 khoảng 150.000 - 250.000 VNĐ; viên bổ sung rất rẻ)",
    "reading_time": "5 phút",
    "time": "Xét nghiệm máu kiểm tra mỗi năm một lần",
    "effort": "Rất thấp",
    "benefits": [
      "Ngăn ngừa tổn thương thoái hóa dây thần kinh ngoại biên không thể hồi phục",
      "Chấm dứt cảm giác tê bì, châm chích bàn chân bàn tay và suy giảm trí nhớ",
      "Điều trị dứt điểm tình trạng thiếu máu hồng cầu to mạn tính gây mệt mỏi"
    ],
    "risks": [
      "Chẩn đoán nhầm thiếu B12 thành biến chứng thần kinh tiểu đường thông thường sẽ bỏ lỡ cơ hội điều trị phục hồi bằng vitamin giá rẻ"
    ],
    "target_groups": [
      "Bệnh nhân đái tháo đường uống Metformin liên tục trên 2 năm, người ăn chay trường (Vegan), người cao tuổi teo niêm mạc dạ dày"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Khuyến cáo tiêu chuẩn chăm sóc y tế của Hiệp hội Đái tháo đường Hoa Kỳ (ADA Standards of Care 2024) và Tổng quan hệ thống Cochrane về tình trạng thiếu hụt vitamin B12.",
    "body": "Vitamin B12 (Cobalamin) là một vi chất dinh dưỡng thiết yếu tuyệt đối cho sự hình thành hồng cầu khỏe mạnh và duy trì lớp bao bọc myelin bảo vệ các tế bào thần kinh. Khác với vitamin C hay nhóm B khác có nhiều trong rau củ, VITAMIN B12 TỰ NHIÊN HẦU NHƯ CHỈ CÓ TRONG THỰC PHẨM NGUỒN GỐC ĐỘNG VẬT (thịt, cá, trứng, sữa, gan động vật).\n\n2 nhóm đối tượng có nguy cơ thiếu hụt B12 cực cao:\n\n1. Người ăn chay trường (Vegan / Vegetarian lâu năm):\n- Thực vật hoàn toàn không thể tự tổng hợp vitamin B12 (trừ một số loại tảo có cấu trúc giả B12 không có hoạt tính sinh học). Sau 3-5 năm ăn chay trường, lượng dự trữ B12 khổng lồ trong gan sẽ cạn kiệt hoàn toàn nếu không uống viên bổ sung.\n\n2. Bệnh nhân Đái tháo đường uống thuốc Metformin kéo dài:\n- Metformin là viên thuốc đầu tay, phổ biến nhất được hàng triệu bệnh nhân tiểu đường sử dụng hàng ngày. Tuy nhiên, theo Hiệp hội Đái tháo đường Hoa Kỳ (ADA), Metformin làm cản trở quá trình hấp thu phụ thuộc canxi của phức hợp Yếu tố nội tại - B12 tại đoạn cuối ruột non (hồi tràng).\n- Có tới 10% đến 30% bệnh nhân dùng Metformin trên 2-3 năm bị thiếu hụt B12 trong máu!\n\nHiểm họa chẩn đoán nhầm tai hại:\nThiếu hụt B12 gây ra các triệu chứng: Tê bì, mất cảm giác, ngứa ran như kiến bò ở đầu ngón chân ngón tay, đi lại loạng choạng, hay quên, lú lẫn và thiếu máu hồng cầu to.\nRất nhiều bác sĩ và bệnh nhân nhầm tưởng các triệu chứng tê bì này là 'Biến chứng thần kinh tiểu đường không thể chữa khỏi'! Thực chất, chỉ cần xét nghiệm máu phát hiện thiếu B12 và bổ sung vài viên vitamin B12 mỗi tuần, các triệu chứng tê bì này sẽ biến mất hoàn toàn!\n\nKhuyến cáo can thiệp chuẩn ADA:\n- Tất cả bệnh nhân dùng Metformin trên 2 năm và người ăn chay trường bắt buộc phải XÉT NGHIỆM NỒNG ĐỘ VITAMIN B12 TRONG MÁU ĐỊNH KỲ HẰNG NĂM.\n- Bổ sung chủ động: Người ăn chay trường nên uống viên bổ sung Cyanocobalamin hoặc Methylcobalamin liều 500 - 1.000 mcg/tuần (hoặc 50 mcg/ngày) để bảo vệ hệ thần kinh.",
    "sources": [
      {
        "title": "Standards of Care in Diabetes—2024",
        "organization": "Diabetes Care / American Diabetes Association (ADA)",
        "url": "https://doi.org/10.2337/dc24-S003",
        "country": "Hoa Kỳ",
        "source_type": "Hướng dẫn tiêu chuẩn chăm sóc đái tháo đường toàn cầu ADA",
        "published_at": "2024-01-01",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Vitamin B12 deficiency in metformin-treated patients with type 2 diabetes",
        "organization": "BMJ (de Jager J, et al.)",
        "url": "https://doi.org/10.1136/bmj.c2181",
        "country": "Hà Lan / Anh Quốc",
        "source_type": "Thử nghiệm lâm sàng ngẫu nhiên mù đôi BMJ",
        "published_at": "2010-05-20",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-kidney-stones-prevention-hydration-067",
    "slug": "du-phong-soi-than-canxi-oxalat-uong-du-nuoc-giam-muoi",
    "title": "Dự phòng Sỏi thận Canxi Oxalat tái phát: Uống đủ 2,5 - 3 lít nước mỗi ngày và giảm muối",
    "description": "Hướng dẫn của Hiệp hội Tiết niệu Hoa Kỳ (AUA) và Hội Tiết niệu - Thận học Việt Nam: Không kiêng canxi quá mức, hạn chế muối ăn và thực phẩm giàu oxalat để ngăn sỏi kết tinh.",
    "category": "health",
    "tags": ["sỏi thận", "canxi oxalat", "tiết niệu", "cơn đau quặn thận", "uống nước"],
    "cost": "Rất thấp (nước lọc sinh hoạt hằng ngày)",
    "reading_time": "5 phút",
    "time": "Duy trì uống nước đều đặn rải rác suốt cả ngày và đêm",
    "effort": "Thấp",
    "benefits": [
      "Giảm tới 50% tỷ lệ tái phát sỏi thận (bệnh nhân từng tán sỏi có 50% nguy cơ mọc lại sỏi trong 5 năm)",
      "Ngăn ngừa các Cơn đau quặn thận kinh hoàng do sỏi rơi xuống làm tắc nghẽn niệu quản",
      "Bảo tồn chức năng lọc của cầu thận, phòng tránh ứ nước suy thận mạn"
    ],
    "risks": [
      "Kiêng canxi cực đoan (nhịn sữa, nhịn tôm cá) là sai lầm nguy hiểm: thiếu canxi đường ruột sẽ làm tăng hấp thu oxalat tự do vào máu khiến sỏi mọc nhanh hơn"
    ],
    "target_groups": [
      "Người từng bị sỏi thận, người có cơ địa lắng đọng cặn sỏi qua siêu âm, người làm việc ngoài trời nắng đổ nhiều mồ hôi"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Hướng dẫn thực hành lâm sàng quản lý y khoa sỏi thận của Hiệp hội Tiết niệu Hoa Kỳ (AUA Guideline 2019) và Hiệp hội Tiết niệu Châu Âu (EAU Guidelines on Urolithiasis 2023).",
    "body": "Những ai từng trải qua Cơn đau quặn thận (Renal Colic) do sỏi thận rơi xuống cọ xát tắc nghẽn niệu quản đều mô tả đó là một trong những cơn đau đớn dữ dội nhất của đời người (đau quằn quại từ thắt lưng lan xuống bẹn, tiểu ra máu, buồn nôn). Điều đáng sợ là sỏi thận có tỷ lệ tái phát cực cao: Hơn 50% bệnh nhân sau khi mổ hoặc tán sỏi sẽ bị mọc lại sỏi mới trong vòng 5 năm nếu không thay đổi lối sống!\nHơn 80% các loại sỏi thận là SỎI CANXI OXALAT.\n\nSai lầm kinh điển: 'Bị sỏi thận thì phải kiêng tuyệt đối canxi':\nRất nhiều người khi biết bị sỏi canxi oxalat liền nhịn uống sữa, kiêng ăn tôm cua cá. Khoa học chứng minh ĐÂY LÀ HÀNH VI LÀM SỎI MỌC NHANH HƠN:\n- Khi bạn ăn đủ canxi tự nhiên trong bữa ăn, canxi sẽ liên kết chặt với phân tử oxalat ngay bên trong đường ruột, tạo thành hợp chất không tan và bị đào thải ra ngoài theo phân.\n- Nếu bạn nhịn ăn canxi, các phân tử oxalat trong thức ăn sẽ ở trạng thái tự do, được ruột hấp thu ồ ạt vào máu, lọc qua thận và kết tinh lại thành sỏi thận!\n\n3 nguyên tắc vàng phòng chống sỏi thận tái phát chuẩn AUA/EAU:\n1. NGUYÊN TẮC VÀNG SỐ 1: UỐNG ĐỦ NƯỚC ĐỂ NƯỚC TIỂU ĐẠT TRÊN 2,5 LÍT/NGÀY:\n- Sự hình thành sỏi giống như việc bạn hòa đường vào cốc nước: Nước quá ít thì đường sẽ kết tinh đóng cặn. Khi bạn uống đủ nước, nước tiểu được pha loãng tối đa, các tinh thể không thể kết tụ lại thành sỏi.\n- Mục tiêu: Nước tiểu luôn có màu vàng nhạt như rơm hoặc trong suốt. Uống một cốc nước lớn trước khi đi ngủ và uống ngay một cốc khi thức dậy ban đêm đi vệ sinh để chống cô đặc nước tiểu về đêm.\n2. ĂN NHẠT - CẮT GIẢM MUỐI (Dưới 5g muối/ngày):\n- Nồng độ Natri cao trong thức ăn sẽ kéo theo việc tăng bài tiết canxi vào nước tiểu (tăng canxi niệu), trực tiếp nuôi dưỡng sỏi thận lớn nhanh.\n3. Hạn chế thực phẩm quá giàu Oxalat và bổ sung Citrate:\n- Hạn chế ăn quá nhiều: Cải bó xôi (rau chân vịt), củ dền, sô-cô-la đen, hạt điều, trà đặc.\n- Uống nước chanh tươi hoặc nước cam: Chứa citrate tự nhiên, chất này gắn cạnh tranh với canxi tạo thành canxi citrate hòa tan, ức chế quá trình hình thành mầm sỏi.",
    "sources": [
      {
        "title": "Medical Management of Kidney Stones: AUA Guideline",
        "organization": "Journal of Urology / American Urological Association (Pearle MS, et al.)",
        "url": "https://doi.org/10.1016/j.juro.2014.05.006",
        "country": "Hoa Kỳ",
        "source_type": "Hướng dẫn lâm sàng điều trị sỏi tiết niệu AUA",
        "published_at": "2019-08-01",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "EAU Guidelines on Urolithiasis",
        "organization": "European Association of Urology (EAU)",
        "url": "https://uroweb.org/guidelines/urolithiasis",
        "country": "Châu Âu",
        "source_type": "Hướng dẫn thực hành sỏi thận châu Âu EAU",
        "published_at": "2023-03-15",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-atrial-fibrillation-stroke-pulse-068",
    "slug": "tu-bat-mach-phat-hien-rung-nhi-phong-ngua-dot-quy-nao",
    "title": "Tự bắt mạch cổ tay phát hiện sớm Rung nhĩ (Atrial Fibrillation): Kẻ chủ mưu gây đột quỵ não",
    "description": "Hướng dẫn của Hội Tim mạch Châu Âu (ESC) và Hội Tim mạch Việt Nam về kỹ thuật tự bắt mạch trong 30 giây phát hiện loạn nhịp hoàn toàn, căn nguyên của 20-30% các ca nhồi máu não diện rộng.",
    "category": "health",
    "tags": ["rung nhĩ", "đột quỵ não", "bắt mạch cổ tay", "loạn nhịp tim", "tim mạch"],
    "cost": "Hoàn toàn miễn phí",
    "reading_time": "5 phút",
    "time": "Tự kiểm tra mạch cổ tay 30 giây mỗi tuần hoặc khi thấy hồi hộp đánh trống ngực",
    "effort": "Rất thấp",
    "benefits": [
      "Phát hiện sớm chứng rung nhĩ âm thầm trước khi xảy ra cơn tai biến liệt nửa người",
      "Được bác sĩ kê đơn thuốc chống đông máu thế novel (NOAC) giảm 70% nguy cơ hình thành cục máu đông",
      "Bảo vệ tính mạng và chức năng vận động cho người cao tuổi"
    ],
    "risks": [
      "Tự ý ngừng thuốc chống đông máu khi thấy người khỏe mạnh sẽ khiến cục máu đông hình thành trở lại ngay trong buồng tim"
    ],
    "target_groups": [
      "Người từ 65 tuổi trở lên, người mắc bệnh tăng huyết áp, suy tim, đái tháo đường hoặc có cảm giác tim đập hẫng hụt"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Khuyến cáo chẩn đoán và quản lý rung nhĩ của Hội Tim mạch Châu Âu (ESC Guidelines for the management of atrial fibrillation 2020) và Khuyến cáo của Hội Tim mạch học Việt Nam (VNHA).",
    "body": "Đột quỵ não (tai biến mạch máu não) do Rung nhĩ (Atrial Fibrillation - AF) là một trong những dạng đột quỵ thảm khốc nhất: Cục máu đông bắn lên não thường làm tắc các nhánh động mạch não lớn, gây nhồi máu não diện rộng với tỷ lệ tử vong và tàn phế vĩnh viễn cao gấp đôi so với đột quỵ do xơ vữa thông thường.\nĐáng sợ nhất: Cứ 3 người bị rung nhĩ thì có 1 người HOÀN TOÀN KHÔNG CÓ BẤT KỲ TRIỆU CHỨNG NÀO! Họ chỉ biết mình bị rung nhĩ khi đã nằm trên giường cấp cứu liệt nửa người!\n\nCơ chế hình thành cục máu đông trong buồng tim:\nỞ người khỏe mạnh, hai tâm nhĩ co bóp nhịp nhàng, tống sạch máu xuống tâm thất. Khi bị rung nhĩ, các xung điện hỗn loạn làm tâm nhĩ không co bóp được mà chỉ rung giật lăn tăn (300-600 lần/phút):\n- Máu trong tâm nhĩ bị ứ trệ, chảy chậm chạp, đặc biệt tại khu vực 'Tiểu nhĩ trái'.\n- Máu ứ đọng sẽ đông lại thành các CỤC MÁU ĐÔNG (Huyết khối).\n- Khi một cục máu đông bị tống ra khỏi tim, nó trôi thẳng lên động mạch cảnh lên não, làm tắc nghẽn mạch máu não tức thì!\n\nKỹ thuật 'TỰ BẮT MẠCH CỔ TAY 30 GIÂY' (Hướng dẫn ESC):\nHội Tim mạch Châu Âu khuyến cáo tất cả người trên 65 tuổi nên được kiểm tra mạch định kỳ:\n1. Tư thế: Ngồi nghỉ ngơi yên tĩnh 5 phút trước khi đo.\n2. Vị trí bắt mạch: Ngửa bàn tay trái lên. Đặt 3 ngón tay (ngón trỏ, giữa và áp út) của bàn tay phải lên cổ tay trái, nằm ở rãnh mạch quay (ngay phía dưới gốc ngón tay cái).\n3. Cảm nhận nhịp đập trong 30 giây:\n- Nhịp tim bình thường: Đập đều đặn như tiếng tích tắc của đồng hồ (nhịp tùng... tùng... tùng... đều tăm tắp với tần số 60 - 90 lần/phút).\n- DẤU HIỆU RUNG NHĨ: Nhịp đập HOÀN TOÀN HỖN LOẠN, KHÔNG CÓ BẤT KỲ QUY LUẬT NÀO! Lúc đập nhanh, lúc đập chậm, lúc đập mạnh, lúc đập rất yếu mất nhịp (nhịp đập kiểu: cắc... tùng... cắc cắc...... tùng...).\n\nNếu bạn phát hiện mạch đập loạn nhịp hỗn loạn: Hãy đến ngay bệnh viện để được đo Điện tâm đồ (ECG) hoặc đeo máy Holter ECG 24 giờ. Nếu chẩn đoán xác định rung nhĩ, bác sĩ sẽ cho dùng thuốc chống đông máu đường uống thế hệ mới (NOAC) giúp triệt tiêu hoàn toàn nguy cơ hình thành cục máu đông, cứu bạn khỏi cơn đột quỵ định mệnh.",
    "sources": [
      {
        "title": "2020 ESC Guidelines for the diagnosis and management of atrial fibrillation developed in collaboration with the EACTS",
        "organization": "European Heart Journal (Hindricks G, et al.)",
        "url": "https://doi.org/10.1093/eurheartj/ehaa612",
        "country": "Châu Âu",
        "source_type": "Hướng dẫn thực hành tim mạch châu Âu ESC",
        "published_at": "2021-02-01",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Khuyến cáo về chẩn đoán và xử trí rung nhĩ",
        "organization": "Hội Tim mạch học Việt Nam (VNHA)",
        "url": "http://vnha.org.vn",
        "country": "Việt Nam",
        "source_type": "Khuyến cáo tim mạch quốc gia chính thức",
        "published_at": "2022-10-15",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  },
  {
    "id": "health-prostate-cancer-psa-screening-069",
    "slug": "tam-soat-ung-thu-tuyen-tien-liet-xet-nghiem-psa",
    "title": "Tầm soát ung thư tuyến tiền liệt: Quyết định dựa trên thảo luận (Shared Decision) và xét nghiệm PSA",
    "description": "Hướng dẫn của Hiệp hội Tiết niệu Hoa Kỳ (AUA) và Bộ Y tế về xét nghiệm kháng nguyên đặc hiệu tuyến tiền liệt (PSA), khám trực tràng (DRE) và tránh sinh thiết quá mức.",
    "category": "health",
    "tags": ["ung thư tuyến tiền liệt", "xét nghiệm psa", "tiết niệu nam", "tầm soát ung thư", "nam giới"],
    "cost": "Vừa phải (xét nghiệm máu PSA khoảng 150.000 - 300.000 VNĐ)",
    "reading_time": "6 phút",
    "time": "Xét nghiệm định kỳ mỗi 2 năm ở nam giới từ 50 đến 69 tuổi",
    "effort": "Thấp (chỉ cần lấy mẫu máu tĩnh mạch)",
    "benefits": [
      "Phát hiện ung thư biểu mô tuyến tiền liệt khi khối u còn khu trú hoàn toàn bên trong vỏ bao",
      "Tỷ lệ chữa khỏi dứt điểm và sống sau 5 năm đạt gần 100% nếu phát hiện ở giai đoạn sớm",
      "Phân biệt với u phì đại lành tính tuyến tiền liệt (BPH) rất phổ biến ở nam giới cao tuổi"
    ],
    "risks": [
      "Chỉ số PSA tăng cao không đồng nghĩa với ung thư (PSA có thể tăng do viêm tuyến tiền liệt hoặc sau đạp xe đường dài)"
    ],
    "target_groups": [
      "Nam giới từ 50 tuổi trở lên (hoặc từ 45 tuổi nếu có cha/anh trai từng mắc ung thư tuyến tiền liệt)"
    ],
    "value_level": "Rất cao",
    "evidence_level": "A",
    "evidence_notes": "Mức bằng chứng A dựa trên Khuyến cáo thực hành lâm sàng của Hiệp hội Tiết niệu Hoa Kỳ (AUA Guideline 2023) và Hướng dẫn chẩn đoán, điều trị ung thư tuyến tiền liệt của Bộ Y tế Việt Nam.",
    "body": "Ung thư tuyến tiền liệt là một trong những bệnh ung thư phổ biến hàng đầu ở nam giới lớn tuổi. Khối u thường tiến triển âm thầm không có triệu chứng rõ ràng ở giai đoạn đầu, hoặc chỉ gây ra các triệu chứng tiểu đêm, tiểu khó, tia nước tiểu yếu rất dễ bị nhầm lẫn với bệnh u phì đại lành tính tuyến tiền liệt thông thường.\n\nXét nghiệm PSA (Prostate-Specific Antigen) là gì?\nPSA là một loại protein do tế bào biểu mô tuyến tiền liệt tiết ra. Một lượng nhỏ PSA thoát vào máu và có thể đo lường dễ dàng qua xét nghiệm máu tĩnh mạch:\n- Chỉ số bình thường: Dưới 4,0 ng/mL.\n- Chỉ số nghi ngờ: Từ 4,0 đến 10,0 ng/mL (Vùng xám - Gray Zone: Có khoảng 25% nguy cơ ung thư).\n- Chỉ số trên 10,0 ng/mL: Nguy cơ ung thư tuyến tiền liệt tăng lên trên 50%, cần làm thêm chụp cộng hưởng từ (MRI đa thông số tuyến tiền liệt) và xem xét sinh thiết.\n\nNguyên tắc 'Thảo luận cùng quyết định' (Shared Decision Making):\nCác hiệp hội y khoa nhấn mạnh: Tầm soát PSA ở nam giới từ 50 đến 69 tuổi không phải là một xét nghiệm áp đặt tự động, mà BẮT BUỘC PHẢI CÓ SỰ THẢO LUẬN KỸ LƯỠNG GIỮA BÁC SĨ VÀ BỆNH NHÂN:\n- Nhiều khối u tuyến tiền liệt ở người già phát triển cực kỳ chậm chạp (indole), không bao giờ gây nguy hiểm đến tính mạng bệnh nhân trong suốt cuộc đời.\n- Nếu tầm soát đại trà cẩu thả dẫn đến sinh thiết vội vã có thể gây ra hiện tượng 'Chẩn đoán quá mức và điều trị quá mức' (Overdiagnosis & Overtreatment), để lại các di chứng tiểu không tự chủ hoặc rối loạn cương dương.\n- Bác sĩ sẽ cân nhắc tuổi thọ kỳ vọng, yếu tố gia đình và chỉ số PSA tự do (Free PSA) để đưa ra quyết định sinh thiết thận trọng nhất.\n\nLời khuyên cho nam giới bước qua tuổi 50:\nNếu bạn ở độ tuổi 50-69, hãy chủ động thảo luận với bác sĩ tiết niệu về việc làm xét nghiệm PSA định kỳ mỗi 2 năm một lần, kết hợp kiểm tra thăm trực tràng (DRE). Phát hiện sớm giúp bạn hoàn toàn làm chủ sức khỏe sinh lực tuổi già.",
    "sources": [
      {
        "title": "Early Detection of Prostate Cancer: AUA/SUO Guideline",
        "organization": "Journal of Urology / American Urological Association (Wei JT, et al.)",
        "url": "https://doi.org/10.1097/JU.0000000000003491",
        "country": "Hoa Kỳ",
        "source_type": "Hướng dẫn lâm sàng tầm soát ung thư tiết niệu AUA",
        "published_at": "2023-07-01",
        "accessed_at": "2026-11-10"
      },
      {
        "title": "Hướng dẫn chẩn đoán và điều trị ung thư tuyến tiền liệt",
        "organization": "Bộ Y tế Việt Nam (Quyết định số 3986/QĐ-BYT)",
        "url": "https://kcb.vn",
        "country": "Việt Nam",
        "source_type": "Hướng dẫn chẩn đoán và điều trị y tế quốc gia",
        "published_at": "2020-09-18",
        "accessed_at": "2026-11-10"
      }
    ],
    "verified_at": null,
    "review_status": "needs_review",
    "status_label": "Chờ rà soát",
    "last_updated": "2026-11-10"
  }
];

const healthPath = path.join(__dirname, '..', 'content', 'articles', 'health.json');
const current = JSON.parse(fs.readFileSync(healthPath, 'utf8'));

const existingIds = new Set(current.map(a => a.id));
let added = 0;
for (const art of healthArticles) {
  if (!existingIds.has(art.id)) {
    current.push(art);
    added++;
  }
}

fs.writeFileSync(healthPath, JSON.stringify(current, null, 2), 'utf8');
console.log(`Updated health.json: ${current.length - added} -> ${current.length} articles (added ${added}).`);

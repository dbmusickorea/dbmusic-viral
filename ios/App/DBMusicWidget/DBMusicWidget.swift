//
//  DBMusicWidget.swift
//  DBMusicWidget
//

import WidgetKit
import SwiftUI

// MARK: - 데이터 모델

struct WidgetData: Codable {
    var name: String?
    // participant
    var level: Int?
    var levelAmount: Int?
    var balance: Int?
    var withdrawableBalance: Int?
    var minWithdrawAmount: Int?
    var activeProjects: [ProjectSummary]?
    // client
    var ongoingCount: Int?
    var projects: [ClientProjectSummary]?
    // admin
    var newSignups: Int?
    var coverPending: Int?
    var snsChangePending: Int?
    var settlementPending: Int?
}

struct ProjectSummary: Codable {
    var name: String
    var status: String
}

struct PlatformStat: Codable {
    var platform: String
    var views: Int
    var likes: Int
    var comments: Int
}

struct ClientProjectSummary: Codable {
    var name: String
    var likes: Int
    var comments: Int
    var views: Int
    var platformStats: [PlatformStat]?
}

// MARK: - Timeline Entry

struct SimpleEntry: TimelineEntry {
    let date: Date
    let role: String?
    let data: WidgetData?
}

// MARK: - Provider

struct Provider: TimelineProvider {
    let appGroupId = "group.com.dbmusic.viral"
    let apiBase = "https://app.doubleb.kr/api/widget-data"

    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), role: "participant", data: WidgetData(level: 1, levelAmount: 2500, balance: 0, withdrawableBalance: 0, minWithdrawAmount: 10000, activeProjects: []))
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let role = defaults.string(forKey: "userRole"),
              let userId = defaults.string(forKey: "userId") else {
            let entry = SimpleEntry(date: Date(), role: nil, data: nil)
            completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(1800))))
            return
        }

        var urlString = "\(apiBase)?role=\(role)"
        if role != "admin" {
            urlString += "&id=\(userId)"
        }

        guard let url = URL(string: urlString) else {
            let entry = SimpleEntry(date: Date(), role: role, data: nil)
            completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(1800))))
            return
        }

        URLSession.shared.dataTask(with: url) { data, _, _ in
            var widgetData: WidgetData? = nil
            if let data = data {
                widgetData = try? JSONDecoder().decode(WidgetData.self, from: data)
            }
            let entry = SimpleEntry(date: Date(), role: role, data: widgetData)
            let nextUpdate = Date().addingTimeInterval(30 * 60) // 30분마다 갱신
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }.resume()
    }
}

// MARK: - 위젯 화면

struct DBMusicWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        if entry.role == nil {
            loggedOutView
        } else if entry.role == "participant" {
            participantView
        } else if entry.role == "client" {
            clientView
        } else if entry.role == "admin" {
            adminView
        } else {
            loggedOutView
        }
    }

    var loggedOutView: some View {
        VStack(spacing: 4) {
            Text("더블비뮤직")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("앱에서 로그인해주세요")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: 체험단

    var participantView: some View {
        if family == .systemSmall {
            return AnyView(participantSmallView)
        } else if family == .systemLarge {
            return AnyView(participantLargeView)
        } else {
            return AnyView(participantDetailView)
        }
    }

    var participantSmallView: some View {
        let d = entry.data
        return VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .center, spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 28, height: 28)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                VStack(alignment: .leading, spacing: 0) {
                    Text("Lv.\(d?.level ?? 1)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(.blue)
                    Text((d?.name?.isEmpty == false ? d!.name! + "님 · 체험단" : "체험단"))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
            }
            Spacer(minLength: 2)
            VStack(alignment: .leading, spacing: 2) {
                Text("\((d?.balance ?? 0).formatted())P")
                    .font(.system(size: 22, weight: .heavy, design: .rounded))
                    .foregroundStyle(.blue)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                Text("적립 포인트")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
    }

    var participantDetailView: some View {
        let d = entry.data
        let progress = min(1.0, Double(d?.withdrawableBalance ?? 0) / Double(max(d?.minWithdrawAmount ?? 10000, 1)))
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 18, height: 18)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                Text((d?.name?.isEmpty == false ? d!.name! + "님 · 체험단" : "체험단"))
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer()
                Text("Lv.\(d?.level ?? 1)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.blue.opacity(0.15))
                    .foregroundStyle(.blue)
                    .clipShape(Capsule())
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("\((d?.withdrawableBalance ?? 0).formatted())P")
                    .font(.system(size: 26, weight: .heavy, design: .rounded))
                    .foregroundStyle(.blue)
                Text("환전 가능 금액")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            if let min = d?.minWithdrawAmount, let w = d?.withdrawableBalance, w < min {
                ProgressView(value: progress)
                    .tint(.blue)
                Text("\((min - w).formatted())P 더 모으면 환전 가능해요")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Divider()
            HStack(spacing: 4) {
                Image(systemName: "music.note.list")
                    .font(.caption2)
                    .foregroundStyle(.purple)
                Text("참여중 프로젝트")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
            }
            if let projects = d?.activeProjects, !projects.isEmpty {
                ForEach(projects.prefix(2), id: \.name) { p in
                    HStack(spacing: 4) {
                        Circle().fill(Color.green).frame(width: 5, height: 5)
                        Text(p.name)
                            .font(.caption2)
                            .lineLimit(1)
                    }
                }
            } else {
                Text("참여중인 프로젝트가 없어요")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
    }

    var participantLargeView: some View {
        let d = entry.data
        let progress = min(1.0, Double(d?.withdrawableBalance ?? 0) / Double(max(d?.minWithdrawAmount ?? 10000, 1)))
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 20, height: 20)
                    .clipShape(RoundedRectangle(cornerRadius: 5))
                Text((d?.name?.isEmpty == false ? d!.name! + "님 · 체험단" : "체험단"))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer()
                Text("Lv.\(d?.level ?? 1)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.blue.opacity(0.15))
                    .foregroundStyle(.blue)
                    .clipShape(Capsule())
            }

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\((d?.balance ?? 0).formatted())P")
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)
                    Text("총 적립금")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .leading, spacing: 2) {
                    Text("\((d?.withdrawableBalance ?? 0).formatted())P")
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .foregroundStyle(.blue)
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)
                    Text("환전 가능 금액")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let min = d?.minWithdrawAmount, let w = d?.withdrawableBalance, w < min {
                ProgressView(value: progress)
                    .tint(.blue)
                Text("\((min - w).formatted())P 더 모으면 환전 가능해요")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Divider()

            HStack(spacing: 4) {
                Image(systemName: "music.note.list")
                    .font(.caption)
                    .foregroundStyle(.purple)
                Text("참여중 프로젝트")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
            }

            if let projects = d?.activeProjects, !projects.isEmpty {
                VStack(spacing: 6) {
                    ForEach(projects.prefix(5), id: \.name) { p in
                        HStack {
                            HStack(spacing: 5) {
                                Circle().fill(Color.green).frame(width: 6, height: 6)
                                Text(p.name)
                                    .font(.caption)
                                    .lineLimit(1)
                            }
                            Spacer()
                            Text(p.status == "ONGOING" ? "진행중" : "대기중")
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.green.opacity(0.15))
                                .foregroundStyle(.green)
                                .clipShape(Capsule())
                        }
                        .padding(8)
                        .background(Color.gray.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            } else {
                Text("참여중인 프로젝트가 없어요")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding()
    }

    // MARK: 의뢰인

    var clientView: some View {
        if family == .systemSmall {
            return AnyView(clientSmallView)
        } else if family == .systemLarge {
            return AnyView(clientLargeView)
        } else {
            return AnyView(clientDetailView)
        }
    }

    var clientSmallView: some View {
        let d = entry.data
        let projects = d?.projects ?? []
        return VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .center, spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 28, height: 28)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                VStack(alignment: .leading, spacing: 0) {
                    Text("진행중 프로젝트")
                        .font(.system(size: 9))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .fixedSize()
                    Text("\(d?.ongoingCount ?? 0)건")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(.purple)
                }
            }
            if projects.isEmpty {
                Spacer(minLength: 2)
                Text("진행중인 프로젝트가 없어요")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            } else {
                Spacer(minLength: 4)
                Text("목록")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                VStack(alignment: .leading, spacing: 3) {
                    ForEach(projects.prefix(2), id: \.name) { p in
                        HStack(spacing: 4) {
                            Circle().fill(Color.purple).frame(width: 5, height: 5)
                            Text(p.name)
                                .font(.caption2)
                                .lineLimit(1)
                        }
                    }
                    if projects.count > 2 {
                        Text("외 \(projects.count - 2)건")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(10)
    }

    var clientDetailView: some View {
        let d = entry.data
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 18, height: 18)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                Text((d?.name?.isEmpty == false ? d!.name! + "님 · 의뢰인" : "의뢰인"))
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer()
                Text("\(d?.ongoingCount ?? 0)건 진행중")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.purple.opacity(0.15))
                    .foregroundStyle(.purple)
                    .clipShape(Capsule())
            }

            if let projects = d?.projects, !projects.isEmpty {
                Divider()
                if projects.count == 1, let p = projects.first {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(p.name)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .lineLimit(1)
                        ForEach(["instagram", "youtube", "tiktok"], id: \.self) { platform in
                            let stat = p.platformStats?.first(where: { $0.platform == platform })
                            HStack(spacing: 5) {
                                Image(platform == "instagram" ? "PlatformInstagram" : platform == "youtube" ? "PlatformYoutube" : "PlatformTiktok")
                                    .resizable()
                                    .frame(width: 12, height: 12)
                                Text("조회 \(stat?.views ?? 0)회 · 좋아요 \(stat?.likes ?? 0)개 · 댓글 \(stat?.comments ?? 0)개")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                } else {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(projects.prefix(2), id: \.name) { p in
                            VStack(alignment: .leading, spacing: 3) {
                                Text(p.name)
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .lineLimit(1)
                                Text("좋아요 \(p.likes) · 댓글 \(p.comments) · 조회 \(p.views)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        if projects.count > 2 {
                            Text("외 \(projects.count - 2)건")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            } else {
                Spacer()
                Text("진행중인 프로젝트가 없어요")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
    }

    var clientLargeView: some View {
        let d = entry.data
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 20, height: 20)
                    .clipShape(RoundedRectangle(cornerRadius: 5))
                Text((d?.name?.isEmpty == false ? d!.name! + "님 · 의뢰인" : "의뢰인"))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer()
                Text("\(d?.ongoingCount ?? 0)건 진행중")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.purple.opacity(0.15))
                    .foregroundStyle(.purple)
                    .clipShape(Capsule())
            }

            Divider()

            if let projects = d?.projects, !projects.isEmpty {
                VStack(spacing: 10) {
                    ForEach(projects.prefix(3), id: \.name) { p in
                        VStack(alignment: .leading, spacing: 5) {
                            Text(p.name)
                                .font(.caption)
                                .fontWeight(.semibold)
                                .lineLimit(1)
                            Text("합계 · 조회 \(p.views)회 · 좋아요 \(p.likes)개 · 댓글 \(p.comments)개")
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundStyle(.primary)
                            ForEach(["instagram", "youtube", "tiktok"], id: \.self) { platform in
                                let stat = p.platformStats?.first(where: { $0.platform == platform })
                                HStack(spacing: 5) {
                                    Image(platform == "instagram" ? "PlatformInstagram" : platform == "youtube" ? "PlatformYoutube" : "PlatformTiktok")
                                        .resizable()
                                        .frame(width: 12, height: 12)
                                    Text("조회 \(stat?.views ?? 0)회 · 좋아요 \(stat?.likes ?? 0)개 · 댓글 \(stat?.comments ?? 0)개")
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .padding(8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.gray.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    if projects.count > 3 {
                        Text("외 \(projects.count - 3)건")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                Text("진행중인 프로젝트가 없어요")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
    }

    // MARK: 관리자

    var adminView: some View {
        if family == .systemSmall {
            return AnyView(adminSmallView)
        } else if family == .systemLarge {
            return AnyView(adminLargeView)
        } else {
            return AnyView(adminDetailView)
        }
    }

    var adminSmallView: some View {
        let d = entry.data
        return VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .center, spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 22, height: 22)
                    .clipShape(RoundedRectangle(cornerRadius: 5))
                Text("관리자")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundStyle(.orange)
            }
            Spacer(minLength: 2)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(d?.coverPending ?? 0)건")
                    .font(.system(size: 18, weight: .heavy, design: .rounded))
                    .foregroundStyle(.orange)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                Text("커버 승인 대기")
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
            }
            Divider()
            VStack(alignment: .leading, spacing: 2) {
                Text("\(d?.settlementPending ?? 0)건")
                    .font(.system(size: 18, weight: .heavy, design: .rounded))
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                Text("정산 대기")
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(10)
    }

    var adminDetailView: some View {
        let d = entry.data
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 18, height: 18)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                Text("관리자")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            Divider()
            VStack(spacing: 7) {
                HStack(spacing: 8) {
                    adminStatCard("신규가입", d?.newSignups ?? 0, "person.badge.plus")
                    adminStatCard("정산대기", d?.settlementPending ?? 0, "wonsign.circle")
                }
                HStack(spacing: 8) {
                    adminStatCard("커버대기", d?.coverPending ?? 0, "music.mic")
                    adminStatCard("SNS요청", d?.snsChangePending ?? 0, "at")
                }
            }
        }
        .padding()
    }

    var adminLargeView: some View {
        let d = entry.data
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image("AppLogo")
                    .resizable()
                    .frame(width: 20, height: 20)
                    .clipShape(RoundedRectangle(cornerRadius: 5))
                Text("관리자")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("오늘의 처리 현황")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Divider()
            VStack(spacing: 10) {
                HStack(spacing: 10) {
                    adminStatCard("신규가입", d?.newSignups ?? 0, "person.badge.plus", big: true)
                    adminStatCard("정산대기", d?.settlementPending ?? 0, "wonsign.circle", big: true)
                }
                HStack(spacing: 10) {
                    adminStatCard("커버승인대기", d?.coverPending ?? 0, "music.mic", big: true)
                    adminStatCard("SNS변경요청", d?.snsChangePending ?? 0, "at", big: true)
                }
            }
            Spacer()
        }
        .padding()
    }

    func adminStatCard(_ label: String, _ value: Int, _ icon: String, big: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                    .foregroundStyle(.orange)
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Text("\(value)\(label.contains("가입") ? "명" : "건")")
                .font(big ? .title2 : .headline)
                .fontWeight(.bold)
        }
        .padding(big ? 12 : 7)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.orange.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - Widget 등록

struct DBMusicWidget: Widget {
    let kind: String = "DBMusicWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                DBMusicWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                DBMusicWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("더블비뮤직")
        .description("체험단/의뢰인/관리자 현황을 한눈에 확인하세요.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Previews

#Preview("체험단 Small", as: .systemSmall) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "participant", data: WidgetData(name: "김철수", level: 12, levelAmount: 5000, balance: 32000, withdrawableBalance: 32000, minWithdrawAmount: 10000, activeProjects: []))
}

#Preview("체험단 Medium", as: .systemMedium) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "participant", data: WidgetData(name: "김철수", level: 12, levelAmount: 5000, balance: 32000, withdrawableBalance: 32000, minWithdrawAmount: 10000, activeProjects: [ProjectSummary(name: "옐로 - 결혼해서 좋겠다", status: "ONGOING")]))
}

#Preview("체험단 Large", as: .systemLarge) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "participant", data: WidgetData(name: "김철수", level: 12, levelAmount: 5000, balance: 32000, withdrawableBalance: 32000, minWithdrawAmount: 10000, activeProjects: [ProjectSummary(name: "옐로 - 결혼해서 좋겠다", status: "ONGOING"), ProjectSummary(name: "다른 아티스트 - 곡명", status: "ONGOING"), ProjectSummary(name: "세번째 아티스트 - 곡명", status: "PENDING")]))
}

#Preview("의뢰인 Small", as: .systemSmall) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "client", data: WidgetData(name: "박대표", ongoingCount: 2, projects: []))
}

#Preview("의뢰인 Medium", as: .systemMedium) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "client", data: WidgetData(name: "박대표", ongoingCount: 1, projects: [ClientProjectSummary(name: "옐로 - 결혼해서 좋겠다", likes: 1240, comments: 89, views: 15300, platformStats: [PlatformStat(platform: "instagram", views: 9200, likes: 800, comments: 60), PlatformStat(platform: "youtube", views: 4100, likes: 300, comments: 20), PlatformStat(platform: "tiktok", views: 2000, likes: 140, comments: 9)])]))
}

#Preview("의뢰인 Large", as: .systemLarge) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "client", data: WidgetData(name: "박대표", ongoingCount: 2, projects: [ClientProjectSummary(name: "옐로 - 결혼해서 좋겠다", likes: 1240, comments: 89, views: 15300, platformStats: [PlatformStat(platform: "instagram", views: 9200, likes: 800, comments: 60), PlatformStat(platform: "youtube", views: 4100, likes: 300, comments: 20), PlatformStat(platform: "tiktok", views: 2000, likes: 140, comments: 9)]), ClientProjectSummary(name: "다른 아티스트 - 곡명", likes: 500, comments: 30, views: 8000, platformStats: [PlatformStat(platform: "instagram", views: 5000, likes: 350, comments: 20), PlatformStat(platform: "youtube", views: 2000, likes: 100, comments: 8), PlatformStat(platform: "tiktok", views: 1000, likes: 50, comments: 2)])]))
}

#Preview("관리자 Small", as: .systemSmall) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "admin", data: WidgetData(newSignups: 5, coverPending: 2, snsChangePending: 1, settlementPending: 3))
}

#Preview("관리자 Medium", as: .systemMedium) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "admin", data: WidgetData(newSignups: 5, coverPending: 2, snsChangePending: 1, settlementPending: 3))
}

#Preview("관리자 Large", as: .systemLarge) {
    DBMusicWidget()
} timeline: {
    SimpleEntry(date: .now, role: "admin", data: WidgetData(newSignups: 5, coverPending: 2, snsChangePending: 1, settlementPending: 3))
}

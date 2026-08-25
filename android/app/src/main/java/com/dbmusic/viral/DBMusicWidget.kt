package com.dbmusic.viral

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.SizeMode
import androidx.glance.action.clickable
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.color.ColorProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private val BlueMain = Color(0xFF2563EB)
private val GrayMuted = Color(0xFF64748B)
private val TextDark = Color(0xFF1E293B)
private val PurpleMain = Color(0xFF9333EA)
private val OrangeMain = Color(0xFFEA580C)

class DBMusicWidget : GlanceAppWidget() {
    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {

        val prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE)
        val userRole = prefs.getString("userRole", null)
        val userId = prefs.getString("userId", null)

        if (userRole == null || userId == null) {
            provideContent {
                WidgetContainer {
                    Text("앱에서 로그인해주세요", style = TextStyle(fontSize = 12.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted)))
                }
            }
            return
        }

        val data = withContext(Dispatchers.IO) { fetchWidgetData(userRole, userId) }

        provideContent {
            WidgetContainer {
                if (data == null) {
                    Text("불러오지 못했어요", style = TextStyle(fontSize = 12.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted)))
                } else if (userRole == "participant") {
                    ParticipantContent(data)
                } else if (userRole == "client") {
                    ClientContent(data)
                } else if (userRole == "admin") {
                    AdminContent(data)
                } else {
                    Text("역할: $userRole", style = TextStyle(fontSize = 12.sp, color = ColorProvider(day = TextDark, night = TextDark)))
                }
            }
        }
    }

    private fun fetchWidgetData(role: String, id: String): JSONObject? {
        return try {
            val urlStr = if (role == "admin") {
                "https://app.doubleb.kr/api/widget-data?role=$role"
            } else {
                "https://app.doubleb.kr/api/widget-data?role=$role&id=$id"
            }
            val conn = URL(urlStr).openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 5000
            conn.readTimeout = 5000
            val responseText = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()
            JSONObject(responseText)
        } catch (e: Exception) {
            null
        }
    }
}

@Composable
private fun WidgetContainer(content: @Composable () -> Unit) {
    val context = androidx.glance.LocalContext.current
    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .appWidgetBackground()
            .background(Color.White)
            .clickable(actionStartActivity(android.content.Intent(context, MainActivity::class.java)))
            .padding(12.dp)
    ) {
        content()
    }
}

@Composable
private fun ParticipantContent(data: JSONObject) {
    val size = LocalSize.current
    // 최소 관측값(95.6dp)보다만 크면 확장 (기기별 최대 크기 편차에 안전하게 대응)
    val showExpanded = size.height > 100.dp
    val showProjects = size.height > 100.dp
    val showDivider = size.height > 300.dp
    val isWide = size.width > 300.dp

    val name = data.optString("name", "")
    val level = data.optInt("level", 1)
    val balance = data.optInt("balance", 0)
    val withdrawable = data.optInt("withdrawableBalance", 0)
    val activeProjects = data.optJSONArray("activeProjects")
    val roleLabel = if (name.isNotEmpty()) "${name}님 · 체험단" else "체험단"

    // 헤더: 로고 + (Lv.X / 이름님·체험단) 세로 두 줄
    Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
        Image(
            provider = ImageProvider(R.mipmap.ic_launcher),
            contentDescription = "로고",
            modifier = GlanceModifier.size(28.dp)
        )
        Spacer(modifier = GlanceModifier.width(6.dp))
        Column {
            Text(
                "Lv.$level",
                style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = BlueMain, night = BlueMain))
            )
            Text(
                roleLabel,
                style = TextStyle(fontSize = 9.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
            )
        }
    }
    Spacer(modifier = GlanceModifier.height(6.dp))

    if (!showExpanded) {
        if (isWide) {
            Row(modifier = GlanceModifier.fillMaxWidth()) {
                Column(modifier = GlanceModifier.defaultWeight()) {
                    Text(
                        "${balance}P",
                        style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark))
                    )
                    Text(
                        "총 적립금",
                        style = TextStyle(fontSize = 9.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
                    )
                }
                Column(modifier = GlanceModifier.defaultWeight()) {
                    Text(
                        "${withdrawable}P",
                        style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = BlueMain, night = BlueMain))
                    )
                    Text(
                        "환전 가능 금액",
                        style = TextStyle(fontSize = 9.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
                    )
                }
            }
        } else {
            Text(
                "${balance}P",
                style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = BlueMain, night = BlueMain))
            )
            Text(
                "적립 포인트",
                style = TextStyle(fontSize = 9.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
            )
        }
    } else {
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                Text(
                    "${balance}P",
                    style = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark))
                )
                Text(
                    "총 적립금",
                    style = TextStyle(fontSize = 11.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
                )
            }
            Column(modifier = GlanceModifier.defaultWeight()) {
                Text(
                    "${withdrawable}P",
                    style = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = BlueMain, night = BlueMain))
                )
                Text(
                    "환전 가능 금액",
                    style = TextStyle(fontSize = 11.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
                )
            }
        }

        val minWithdraw = 10000
        if (withdrawable < minWithdraw) {
            Spacer(modifier = GlanceModifier.height(6.dp))
            LinearProgressIndicator(
                modifier = GlanceModifier.fillMaxWidth().height(5.dp),
                progress = (withdrawable.toFloat() / minWithdraw.toFloat()).coerceIn(0f, 1f),
                color = ColorProvider(day = BlueMain, night = BlueMain),
                backgroundColor = ColorProvider(day = Color(0xFFE2E8F0), night = Color(0xFFE2E8F0))
            )
            Spacer(modifier = GlanceModifier.height(3.dp))
            Text(
                "${minWithdraw - withdrawable}P 더 모으면 환전 가능해요",
                style = TextStyle(fontSize = 10.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
            )
        }

        if (showDivider) {
            Spacer(modifier = GlanceModifier.height(8.dp))
            Row(modifier = GlanceModifier.fillMaxWidth().height(1.dp).background(Color(0xFFE2E8F0))) {}
        }

        if (showProjects) {
            Spacer(modifier = GlanceModifier.height(8.dp))
            val firstProject = activeProjects?.optJSONObject(0)
            Text(
                firstProject?.optString("name", "") ?: "참여중인 프로젝트가 없어요",
                style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark))
            )
        }
    }
}

@Composable
private fun ClientContent(data: JSONObject) {
    val size = LocalSize.current
    val isExpanded = size.height > 100.dp
    val isWide = size.width > 300.dp

    val name = data.optString("name", "")
    val ongoingCount = data.optInt("ongoingCount", 0)
    val projects = data.optJSONArray("projects")
    val firstProject = projects?.optJSONObject(0)
    val roleLabel = if (name.isNotEmpty()) "${name}님 · 의뢰인" else "의뢰인"

    if (!isWide) {
        // 작은 상태: 로고 + (진행중 프로젝트 / N건) 두 줄
        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
            Image(
                provider = ImageProvider(R.mipmap.ic_launcher),
                contentDescription = "로고",
                modifier = GlanceModifier.size(28.dp)
            )
            Spacer(modifier = GlanceModifier.width(6.dp))
            Column {
                Text(
                    "진행중 프로젝트",
                    style = TextStyle(fontSize = 9.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
                )
                Text(
                    "${ongoingCount}건",
                    style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = PurpleMain, night = PurpleMain))
                )
            }
        }
    } else {
        // 큰 상태: 로고 + 이름·의뢰인 (왼쪽) + N건 진행중 배지 (오른쪽 끝)
        Row(verticalAlignment = Alignment.Vertical.CenterVertically, modifier = GlanceModifier.fillMaxWidth()) {
            Image(
                provider = ImageProvider(R.mipmap.ic_launcher),
                contentDescription = "로고",
                modifier = GlanceModifier.size(20.dp)
            )
            Spacer(modifier = GlanceModifier.width(6.dp))
            Text(
                roleLabel,
                style = TextStyle(fontSize = 11.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
            )
            Spacer(modifier = GlanceModifier.defaultWeight())
            Text(
                "${ongoingCount}건 진행중",
                style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = PurpleMain, night = PurpleMain)),
                modifier = GlanceModifier
                    .background(Color(0x269333EA))
                    .cornerRadius(10.dp)
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            )
        }
    }
    Spacer(modifier = GlanceModifier.height(8.dp))

    val projectCount = projects?.length() ?: 0

    if (firstProject == null) {
        Text(
            "진행중인 프로젝트가 없어요",
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark))
        )
    } else if (!isExpanded) {
        Text(
            firstProject.optString("name", ""),
            style = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark)),
            maxLines = 1
        )
    } else if (projectCount == 1) {
        // 프로젝트 1개: 플랫폼별 세부 통계
        Text(
            firstProject.optString("name", ""),
            style = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark)),
            maxLines = 1
        )
        Spacer(modifier = GlanceModifier.height(4.dp))
        val platformStats = firstProject.optJSONArray("platformStats")
        if (platformStats != null) {
            for (i in 0 until platformStats.length()) {
                val stat = platformStats.optJSONObject(i) ?: continue
                val platform = stat.optString("platform", "")
                val iconRes = when (platform) {
                    "instagram" -> R.drawable.platform_instagram
                    "youtube" -> R.drawable.platform_youtube
                    "tiktok" -> R.drawable.platform_tiktok
                    else -> null
                }
                Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                    if (iconRes != null) {
                        Image(
                            provider = ImageProvider(iconRes),
                            contentDescription = platform,
                            modifier = GlanceModifier.size(14.dp)
                        )
                        Spacer(modifier = GlanceModifier.width(4.dp))
                    }
                    Text(
                        "조회 ${stat.optInt("views", 0)} · 좋아요 ${stat.optInt("likes", 0)} · 댓글 ${stat.optInt("comments", 0)}",
                        style = TextStyle(fontSize = 10.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted)),
                        maxLines = 1
                    )
                }
                Spacer(modifier = GlanceModifier.height(2.dp))
            }
        }
    } else {
        // 프로젝트 2개 이상: 프로젝트별 통합 수치
        for (i in 0 until minOf(projectCount, 2)) {
            val project = projects?.optJSONObject(i) ?: continue
            Text(
                project.optString("name", ""),
                style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark)),
                maxLines = 1
            )
            Text(
                "좋아요 ${project.optInt("likes", 0)} · 댓글 ${project.optInt("comments", 0)} · 조회 ${project.optInt("views", 0)}",
                style = TextStyle(fontSize = 12.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
            )
            Spacer(modifier = GlanceModifier.height(4.dp))
        }
        if (projectCount > 2) {
            Text(
                "외 ${projectCount - 2}건",
                style = TextStyle(fontSize = 11.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
            )
        }
    }
}

@Composable
private fun AdminContent(data: JSONObject) {
    val size = LocalSize.current
    val isExpanded = size.height > 100.dp

    val newSignups = data.optInt("newSignups", 0)
    val settlementPending = data.optInt("settlementPending", 0)
    val coverPending = data.optInt("coverPending", 0)
    val snsChangePending = data.optInt("snsChangePending", 0)

    Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
        Image(
            provider = ImageProvider(R.mipmap.ic_launcher),
            contentDescription = "로고",
            modifier = GlanceModifier.size(24.dp)
        )
        Spacer(modifier = GlanceModifier.width(6.dp))
        Text(
            "관리자",
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = OrangeMain, night = OrangeMain))
        )
    }

    if (!isExpanded) {
        Spacer(modifier = GlanceModifier.height(6.dp))
        Text(
            "${settlementPending}건",
            style = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = OrangeMain, night = OrangeMain))
        )
        Text(
            "정산 대기",
            style = TextStyle(fontSize = 11.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
        )
    } else {
        Spacer(modifier = GlanceModifier.height(8.dp))
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            AdminStatCard("신규가입", newSignups, "명", GlanceModifier.defaultWeight())
            Spacer(modifier = GlanceModifier.width(8.dp))
            AdminStatCard("정산대기", settlementPending, "건", GlanceModifier.defaultWeight())
        }
        Spacer(modifier = GlanceModifier.height(8.dp))
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            AdminStatCard("커버대기", coverPending, "건", GlanceModifier.defaultWeight())
            Spacer(modifier = GlanceModifier.width(8.dp))
            AdminStatCard("SNS요청", snsChangePending, "건", GlanceModifier.defaultWeight())
        }
    }
}

@Composable
private fun AdminStatCard(label: String, value: Int, unit: String, modifier: GlanceModifier) {
    Column(
        modifier = modifier
            .background(Color(0x1AEA580C))
            .cornerRadius(10.dp)
            .padding(8.dp)
    ) {
        Text(
            label,
            style = TextStyle(fontSize = 9.sp, color = ColorProvider(day = GrayMuted, night = GrayMuted))
        )
        Text(
            "${value}${unit}",
            style = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ColorProvider(day = TextDark, night = TextDark))
        )
    }
}

class DBMusicWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = DBMusicWidget()
}

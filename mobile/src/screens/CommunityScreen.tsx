import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, shadow } from '../theme';

const MOCK_POSTS = [
  { id: '1', user: 'FrontierExplorer42', grade: 'A', ret: '12.3', risk: '14.1', likes: 24, comments: 5, time: '2h ago' },
  { id: '2', user: 'WealthBuilder99', grade: 'B', ret: '9.8', risk: '11.2', likes: 18, comments: 3, time: '4h ago' },
  { id: '3', user: 'DiversifyQueen', grade: 'A', ret: '11.1', risk: '12.8', likes: 31, comments: 8, time: '6h ago' },
  { id: '4', user: 'IndexFundFan', grade: 'B', ret: '8.5', risk: '9.4', likes: 12, comments: 2, time: '1d ago' },
  { id: '5', user: 'RiskTaker2026', grade: 'C', ret: '15.2', risk: '22.1', likes: 9, comments: 1, time: '1d ago' },
  { id: '6', user: 'SteadyGrowth', grade: 'B', ret: '10.0', risk: '12.0', likes: 15, comments: 4, time: '2d ago' },
  { id: '7', user: 'ETFNovice', grade: 'C', ret: '7.8', risk: '10.5', likes: 6, comments: 0, time: '3d ago' },
  { id: '8', user: 'RetirementReady', grade: 'A', ret: '11.5', risk: '11.9', likes: 42, comments: 12, time: '3d ago' },
];

function gradeColor(g: string) { return g === 'A' ? '#10B981' : g === 'B' ? '#3B82F6' : '#F59E0B'; }

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});

  function handleLike(id: string) {
    setLocalLikes(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function handleShare() {
    Share.share({ message: "I'm building my investment portfolio with My Frontier. Free app, real math. Check it out: myfrontierapp.com" });
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Community</Text>
        <TouchableOpacity onPress={handleShare}><Text style={s.shareBtn}>Share Mine</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Share card */}
        <TouchableOpacity style={s.shareCard} onPress={() => navigation.navigate('Categories', { name: 'Investor' })} activeOpacity={0.8}>
          <Text style={s.shareCardTitle}>Share Your Portfolio</Text>
          <Text style={s.shareCardSub}>Build a portfolio first, then share it with the community</Text>
        </TouchableOpacity>

        {MOCK_POSTS.map((post, i) => (
          <React.Fragment key={post.id}>
            {i === 2 && (
              <TouchableOpacity style={s.inviteCard} onPress={handleShare} activeOpacity={0.8}>
                <Text style={s.inviteTitle}>Invite friends to My Frontier</Text>
                <Text style={s.inviteSub}>Share the app and grow your wealth together</Text>
                <View style={s.inviteBtn}><Text style={s.inviteBtnText}>Send Invite</Text></View>
              </TouchableOpacity>
            )}
            <View style={s.postCard}>
              <View style={s.postTop}>
                <Text style={s.postUser}>{post.user}</Text>
                <Text style={s.postTime}>{post.time}</Text>
              </View>
              <View style={s.postBody}>
                <Text style={[s.postGrade, { color: gradeColor(post.grade) }]}>{post.grade}</Text>
                <View style={s.postStats}>
                  <Text style={s.postStat}>{post.ret}% return</Text>
                  <Text style={s.postStat}>{post.risk}% risk</Text>
                </View>
              </View>
              <View style={s.postActions}>
                <TouchableOpacity onPress={() => handleLike(post.id)} style={s.likeBtn}>
                  <Text style={s.likeText}>❤️ {post.likes + (localLikes[post.id] ?? 0)}</Text>
                </TouchableOpacity>
                <Text style={s.commentText}>💬 {post.comments}</Text>
              </View>
            </View>
          </React.Fragment>
        ))}

        {/* Weekly Challenge */}
        <View style={s.challengeCard}>
          <Text style={s.challengeTitle}>This Week's Challenge</Text>
          <Text style={s.challengeDesc}>Build a portfolio with a Sharpe ratio above 1.0</Text>
          <Text style={s.challengeCount}>47 users completed</Text>
          <TouchableOpacity style={s.challengeBtn} onPress={() => navigation.navigate('Categories', { name: 'Investor' })}>
            <Text style={s.challengeBtnText}>Accept Challenge</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  shareBtn: { fontSize: 14, fontWeight: '700', color: colors.primary },
  scroll: { padding: spacing.lg, gap: spacing.md },
  shareCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  shareCardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  shareCardSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  inviteCard: { backgroundColor: '#3B82F615', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary, padding: spacing.lg, alignItems: 'center', gap: 8 },
  inviteTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  inviteSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  inviteBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 10 },
  inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  postCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  postTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  postUser: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  postTime: { fontSize: 12, color: colors.textMuted },
  postBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  postGrade: { fontSize: 36, fontWeight: '900' },
  postStats: { gap: 4 },
  postStat: { fontSize: 13, color: colors.textSecondary },
  postActions: { flexDirection: 'row', gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  likeBtn: { flexDirection: 'row', alignItems: 'center' },
  likeText: { fontSize: 13, color: colors.textSecondary },
  commentText: { fontSize: 13, color: colors.textMuted },
  challengeCard: { backgroundColor: '#F59E0B15', borderRadius: radius.lg, borderWidth: 1, borderColor: '#F59E0B', padding: spacing.lg, alignItems: 'center', gap: 8 },
  challengeTitle: { fontSize: 16, fontWeight: '800', color: '#F59E0B' },
  challengeDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  challengeCount: { fontSize: 12, color: colors.textMuted },
  challengeBtn: { backgroundColor: '#F59E0B', borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 10 },
  challengeBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
});

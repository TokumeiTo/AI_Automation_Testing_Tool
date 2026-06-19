import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import TimelineAccordion from './TimelineAccordion';

export default function EvidenceDashboard({ playbackResult, activeRunId, videoFilename, backendUrl }) {
    if (!playbackResult) return null;

    const isPassed = playbackResult.status === 'PASSED';

    // 📈 Compute Complex Metrics
    const totalSteps = playbackResult.stepsTrack?.length || 0;
    const passedSteps = playbackResult.stepsTrack?.filter(s => s.status === 'PASSED').length || 0;
    const failedSteps = totalSteps - passedSteps;
    const passRate = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 0;

    // SVG Circumference Logic
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const passStrokeDashoffset = circumference - (passRate / 100) * circumference;

    // 🎥 Construct the path to your Playwright video asset
    const videoUrl = videoFilename
        ? `${backendUrl}/evidence/${activeRunId}/${videoFilename}`
        : null;

    return (
        <Box sx={{ mt: 5, fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>

            {/* SECTION TITLE */}
            <Box sx={{ p: 1, mb: 2, borderLeft: '4px solid #1e3a8a', bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                    自動テスト実行概要レポート (Automated Suite Execution Summary)
                </Typography>
            </Box>

            {/* COMPLEX KPI METRICS CONTAINER BLOCK (MIGRATED TO FLEXBOX) */}
            <Paper square elevation={0} sx={{ border: '1px solid #cbd5e1', bgcolor: '#ffffff', mb: 3, p: 3 }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' }, 
                    alignItems: 'center', 
                    gap: 3
                }}>
                    
                    {/* COLUMN 1: CIRCULAR KPI CHART */}
                    <Box sx={{ 
                        flex: { xs: '1 1 100%', md: '0 0 30%' }, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        borderRight: { md: '1px solid #e2e8f0' },
                        maxWidth:'200px'
                    }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex', width: 200, height: 200, }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="50" cy="50" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    stroke={failedSteps > 0 ? "#10b981" : "#059669"}
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={passStrokeDashoffset}
                                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                                />
                            </svg>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.65rem', fontFamily: 'monospace' }}>
                                    {passRate}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b',textAlign:'center', fontSize: '0.75rem', fontWeight: 600, mt: 0.5 }}>
                                    成功率 
                                    <br/>
                                    (PASS RATE)
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* COLUMN 2: DENSE DATA FLEX CONTAINERS */}
                    <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 45%' }, width: '100%' }}>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: '#64748b', mb: 1, letterSpacing: '0.05em' }}>
                            📊 メトリクス詳細 (EXECUTION SNAPSHOT DATA)
                        </Typography>
                        
                        {/* 2x2 Dense Grid via Flexboxes */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f8fafc', borderLeft: '3px solid #475569' }}>
                                    <Typography variant="caption" display="block" sx={{ color: '#64748b' }}>全ステップ数 (Total Steps)</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{totalSteps}</Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f0fdf4', borderLeft: '3px solid #10b981' }}>
                                    <Typography variant="caption" display="block" sx={{ color: '#15803d' }}>成功数 (Passed Steps)</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#166534' }}>{passedSteps}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Box sx={{ flex: 1, p: 1.5, bgcolor: failedSteps > 0 ? '#fef2f2' : '#f8fafc', borderLeft: failedSteps > 0 ? '3px solid #ef4444' : '3px solid #cbd5e1' }}>
                                    <Typography variant="caption" display="block" sx={{ color: failedSteps > 0 ? '#b91c1c' : '#64748b' }}>失敗数 (Failed Steps)</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace', color: failedSteps > 0 ? '#991b1b' : '#64748b' }}>{failedSteps}</Typography>
                                </Box>
                                <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f8fafc', borderLeft: '3px solid #1e3a8a' }}>
                                    <Typography variant="caption" display="block" sx={{ color: '#1e3a8a' }}>総実行時間 (Total Duration)</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                        {(playbackResult.totalDurationMs / 1000).toFixed(2)}s
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* COLUMN 3: GLOBAL RUNTIME CONFIG */}
                    <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 25%' }, width: '100%', alignSelf: 'stretch' }}>
                        <Box sx={{ p: 2, bgcolor: '#f4f6f9', border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: '#475569', mb: 0.5, fontSize: '0.7rem' }}>
                                💻 実行環境構成 (ENVIRONMENT CONFIG)
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ブラウザ (Browser):</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>{playbackResult.browser || 'Edge'}</span>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>判定 (Verdict):</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isPassed ? '#10b981' : '#ef4444' }}>
                                        {isPassed ? 'PASSED' : 'FAILED'}
                                    </span>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                </Box>
            </Paper>

            {/* 🎥 EVIDENCE VIDEO PLAYER BLOCK */}
            <Box sx={{ p: 1, mb: 1.5, borderLeft: '4px solid #475569', bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayCircleOutlinedIcon sx={{ fontSize: 18, color: '#475569' }} />
                    エビデンス録画ビデオ (Execution Evidence Video Playback)
                </Typography>
            </Box>

            <Paper square variant="outlined" sx={{ p: 2, mb: 4, bgcolor: '#0f172a', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    {videoUrl ? (
                        <video
                            src={videoUrl}
                            controls
                            preload="auto"
                            style={{ width: '100%', display: 'block', maxHeight: '450px', backgroundColor: '#000000' }}
                        />
                    ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8', p: 4, display: 'block', textAlign: 'center' }}>
                            録画ビデオの読み込み中、またはファイルが見つかりません (No recording video discovered for this run target.)
                        </Typography>
                    )}
                </Box>
            </Paper>

            {/* SYSTEM FAILURE BANNER EXCEPTION SUMMARY */}
            {!isPassed && playbackResult.failureReason && (
                <Box sx={{ mb: 4, p: 2, bgcolor: '#fff5f5', border: '1px solid #fca5a5', borderLeft: '4px solid #ef4444' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#991b1b', display: 'block', mb: 0.5 }}>
                        ⚠️ スイート例外アラート (Failure Message):
                    </Typography>
                    <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', color: '#7f1d1d', whiteSpace: 'pre-wrap', m: 0, display: 'block', bgcolor: '#fff', p: 1 }}>
                        {playbackResult.failureReason}
                    </Typography>
                </Box>
            )}

            {/* TIMELINE LIST */}
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569', fontSize: '0.85rem' }}>
                📍 各ステップ詳細確認 (Step Verification History Timeline Tracking)
            </Typography>

            {playbackResult.stepsTrack?.map((reportStep) => (
                <TimelineAccordion
                    key={reportStep.id}
                    reportStep={reportStep}
                    activeRunId={activeRunId}
                    backendUrl={backendUrl}
                />
            ))}
        </Box>
    );
}
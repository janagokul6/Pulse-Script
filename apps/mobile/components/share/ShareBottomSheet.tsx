import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Alert, Linking, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ShareBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    post: {
        id: string;
        title?: string;
        caseSummary: string;
    };
}

export default function ShareBottomSheet({ visible, onClose, post }: ShareBottomSheetProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const title = post.title || (post.caseSummary && post.caseSummary.split('\n')[0].substring(0, 60)) || 'Clinical Case';
    const postUrl = `https://medijournal.com/post/${post.id}`;
    const shareText = `Check out this clinical case: ${title}\n\n${postUrl}`;

    const handleCopyLink = async () => {
        await Clipboard.setStringAsync(postUrl);
        Alert.alert('Link Copied', 'The case link has been copied to your clipboard.', [{ text: 'OK', onPress: onClose }]);
    };

    const handleShareApp = async (platform: 'whatsapp' | 'twitter' | 'linkedin' | 'reddit' | 'substack' | 'medium' | 'doximity') => {
        let url = '';
        const encodedUrl = encodeURIComponent(postUrl);
        const encodedText = encodeURIComponent(shareText);
        const encodedTitle = encodeURIComponent(title);

        switch (platform) {
            case 'whatsapp':
                url = `whatsapp://send?text=${encodedText}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this clinical case on MediJournal:`)}&url=${encodedUrl}`;
                break;
            case 'linkedin':
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
            case 'reddit':
                url = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
                break;
            case 'substack':
                // Substack Notes or general create post intent (using web fallback)
                url = `https://substack.com/notes/new`;
                break;
            case 'medium':
                // Medium story intent
                url = `https://medium.com/new-story`;
                break;
            case 'doximity':
                // Medical specific platform sharing
                url = `https://www.doximity.com/articles/share?url=${encodedUrl}&title=${encodedTitle}`;
                break;
        }

        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
                onClose();
            } else {
                if (platform === 'whatsapp') {
                    Alert.alert('App not found', 'WhatsApp does not seem to be installed on this device.');
                } else {
                    await Linking.openURL(url);
                    onClose();
                }
            }
        } catch {
            Alert.alert('Error', 'Could not open the sharing intent.');
        }
    };

    const handleMoreOptions = () => {
        Share.share({
            message: shareText,
            url: postUrl, // iOS only
            title: title, // Android only
        })
            .then(() => onClose())
            .catch(() => { });
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom || 32 }]}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={[styles.handle, { backgroundColor: theme.border }]} />
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Share Case</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={[styles.closeBtn, { color: theme.secondary }]}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.optionsGrid}>
                            <ShareOption
                                icon={{ ios: 'bubble.left.and.bubble.right.fill', android: 'chat', web: 'chat' }}
                                label="WhatsApp"
                                color="#25D366"
                                onPress={() => handleShareApp('whatsapp')}
                                theme={theme}
                            />
                            <ShareOption
                                icon={{ ios: 'a.square', android: 'flutter_dash', web: 'flutter_dash' }}
                                label="X (Twitter)"
                                color="#000000"
                                onPress={() => handleShareApp('twitter')}
                                theme={theme}
                                isDarkIcon
                            />
                            <ShareOption
                                icon={{ ios: 'bubble.left.fill', android: 'forum', web: 'forum' }}
                                label="Reddit"
                                color="#FF4500"
                                onPress={() => handleShareApp('reddit')}
                                theme={theme}
                            />
                            <ShareOption
                                icon={{ ios: 'doc.richtext.fill', android: 'article', web: 'article' }}
                                label="Substack"
                                color="#FF6719"
                                onPress={() => handleShareApp('substack')}
                                theme={theme}
                            />
                            <ShareOption
                                icon={{ ios: 'text.quote', android: 'format_quote', web: 'format_quote' }}
                                label="Medium"
                                color="#000000"
                                onPress={() => handleShareApp('medium')}
                                theme={theme}
                                isDarkIcon
                            />
                            <ShareOption
                                icon={{ ios: 'cross.vial.fill', android: 'healing', web: 'healing' }}
                                label="Doximity"
                                color="#005e9c"
                                onPress={() => handleShareApp('doximity')}
                                theme={theme}
                            />
                            <ShareOption
                                icon={{ ios: 'person.3.fill', android: 'group', web: 'group' }}
                                label="LinkedIn"
                                color="#0A66C2"
                                onPress={() => handleShareApp('linkedin')}
                                theme={theme}
                            />
                            <ShareOption
                                icon={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
                                label="Copy Link"
                                color={theme.tint}
                                onPress={handleCopyLink}
                                theme={theme}
                            />
                            <ShareOption
                                icon={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
                                label="More"
                                color={theme.secondary}
                                onPress={handleMoreOptions}
                                theme={theme}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function ShareOption({ icon, label, color, onPress, theme, isDarkIcon = false }: any) {
    const isDarkMode = theme.background === '#000000';
    const bgColor = isDarkIcon && isDarkMode ? '#333' : color + '1a';
    const iconColor = isDarkIcon && isDarkMode ? '#fff' : color;

    return (
        <TouchableOpacity style={styles.optionContainer} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
                <SymbolView name={icon} tintColor={iconColor} size={26} />
            </View>
            <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    handle: {
        position: 'absolute',
        top: 8,
        left: '50%',
        marginLeft: -20,
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        flex: 1,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    closeBtn: {
        fontSize: 18,
        fontWeight: '600',
        paddingLeft: 8,
    },
    content: {
        padding: 24,
        paddingTop: 28,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
    },
    optionContainer: {
        alignItems: 'center',
        width: '28%', // fit 3-4 items nicely
        marginBottom: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});

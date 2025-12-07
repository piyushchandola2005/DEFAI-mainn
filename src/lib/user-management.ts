import { supabase } from "./supabase";

export interface UserRegistrationResult {
  user: any;
  isNewUser: boolean;
}

export async function registerOrUpdateUser(walletAddress: string): Promise<UserRegistrationResult | null> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  try {
    // First, try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return null;
    }
    
    if (existingUser) {
      // Update last_connected_at for existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          last_connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', normalizedAddress)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating user:', updateError);
        return null;
      }
      
      return { user: updatedUser, isNewUser: false };
    } else {
      // Try using the secure function first
      let newUser, insertError;
      
      try {
        const result = await supabase
          .rpc('handle_new_user', { wallet_address: normalizedAddress })
          .single();
        newUser = result.data;
        insertError = result.error;
      } catch (e) {
        insertError = e;
      }
      
      // Fallback to direct insert if RPC fails
      if (insertError) {
        console.log('RPC function not available, using direct insert:', insertError);
        const defaultName = `User ${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`;
        const result = await supabase
          .from('users')
          .insert({
            wallet_address: normalizedAddress,
            display_name: defaultName,
            last_connected_at: new Date().toISOString()
          })
          .select()
          .single();
        newUser = result.data;
        insertError = result.error;
      }
        
      if (insertError) {
        console.error('Error creating user:', insertError);
        return null;
      }
      
      return { user: newUser, isNewUser: true };
    }
  } catch (error) {
    console.error('Error in registerOrUpdateUser:', error);
    return null;
  }
}

export async function getUserByWallet(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserByWallet:', error);
    return null;
  }
}

export async function createChat(userId: string, title: string = 'New Chat') {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: userId,
        title: title,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createChat:', error);
    return null;
  }
}

export async function saveMessage(chatId: string, role: 'user' | 'assistant' | 'system', content: string, metadata: any = {}) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: role,
        content: content,
        metadata: metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving message:', error);
      return null;
    }
    
    // Update chat's last_message_at
    await supabase
      .from('chats')
      .update({ 
        last_message_at: new Date().toISOString() 
      })
      .eq('id', chatId);
    
    return data;
  } catch (error) {
    console.error('Error in saveMessage:', error);
    return null;
  }
}

export async function getUserChats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserChats:', error);
    return [];
  }
}

export async function getChatMessages(chatId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    return [];
  }
}

import { authenticatedBaseQuery } from "@/redux/app/baseQueries";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface ChatMessage {
  message_id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  conversation_id: string;
  user_id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Conversations"],
  endpoints: (builder) => ({
    getConversations: builder.query<ChatConversation[], void>({
      query: () => ({
        url: "/chat/conversations",
      }),
      providesTags: ["Conversations"],
    }),

    getConversation: builder.query<
      {
        conversation: ChatConversation;
        messages: ChatMessage[];
      },
      string
    >({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}`,
      }),
      providesTags: (result, error, conversationId) => [
        { type: "Conversations", id: conversationId },
      ],
    }),

    createConversation: builder.mutation<
      ChatConversation,
      { title: string; projectId: string }
    >({
      query: (body) => ({
        url: "/chat/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),

    updateConversation: builder.mutation<
      void,
      { conversationId: string; title: string }
    >({
      query: ({ conversationId, title }) => ({
        url: `/chat/conversations/${conversationId}`,
        method: "PUT",
        body: { title },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Conversations", id: conversationId },
        "Conversations",
      ],
    }),

    deleteConversation: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Conversations"],
    }),

    addMessage: builder.mutation<
      ChatMessage,
      { conversationId: string; content: string }
    >({
      query: ({ conversationId, content }) => ({
        url: `/chat/conversations/${conversationId}/messages`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Conversations", id: conversationId },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useDeleteConversationMutation,
  useAddMessageMutation,
} = chatApi;
